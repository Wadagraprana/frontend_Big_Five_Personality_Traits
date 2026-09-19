import { useEffect, useRef, useState } from "react"
import { useFetcher, useNavigate } from "react-router"
import { AudioLevelMeter } from "~/components/input/audio-level-meter"
import { CameraPreview } from "~/components/input/camera-preview"
import { GuidePanel } from "~/components/input/guide-panel"
import { UploadDropzone } from "~/components/input/upload-dropzone"
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { Checkbox } from "~/components/ui/checkbox"
import { Label } from "~/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs"

type InputMode = "record" | "upload"
type PermissionState = "idle" | "pending" | "granted" | "denied"

const acceptedExtensions = ["mp4", "webm", "mov"]
const minDurationSeconds = 15
const maxDurationSeconds = 60
const maxFileSizeBytes = 100 * 1024 * 1024

// Makin kecil pembagi, makin sensitif meter suara.
const audioLevelDivisor = 16
// Batasi pembaruan state level suara (~15 kali per detik) agar render tidak berlebihan.
const audioLevelUpdateIntervalMs = 66

function validateExtension(file: File) {
    const extension = file.name.split(".").pop()?.toLowerCase()
    return extension && acceptedExtensions.includes(extension)
}

async function readVideoDuration(file: File) {
    const url = URL.createObjectURL(file)
    const video = document.createElement("video")
    video.preload = "metadata"
    video.src = url
    try {
        await new Promise<void>((resolve, reject) => {
            video.onloadedmetadata = () => resolve()
            video.onerror = () => reject(new Error("Durasi video tidak dapat dibaca."))
        })
        return video.duration
    } finally {
        URL.revokeObjectURL(url)
    }
}

export function InputScreen() {
    const navigate = useNavigate()
    const fetcher = useFetcher<{ jobId: string }>()
    const videoRef = useRef<HTMLVideoElement>(null)
    const recorderRef = useRef<MediaRecorder | null>(null)
    const chunksRef = useRef<Blob[]>([])
    const recordingStartedAtRef = useRef<number | null>(null)
    const audioContextRef = useRef<AudioContext | null>(null)
    const analyserRef = useRef<AnalyserNode | null>(null)
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
    const animationFrameRef = useRef<number | null>(null)
    const lastLevelUpdateRef = useRef(0)
    // Ref yang mencerminkan state, agar cleanup saat unmount selalu membaca nilai terbaru.
    const streamRef = useRef<MediaStream | null>(null)
    const recordedVideoUrlRef = useRef<string | undefined>(undefined)
    const [mode, setMode] = useState<InputMode>("record")
    const [consent, setConsent] = useState(false)
    const [permission, setPermission] = useState<PermissionState>("idle")
    const [stream, setStream] = useState<MediaStream | null>(null)
    const [isRecording, setIsRecording] = useState(false)
    const [elapsedSeconds, setElapsedSeconds] = useState(0)
    const [audioLevel, setAudioLevel] = useState(0)
    const [videoReady, setVideoReady] = useState(false)
    const [recordedVideoUrl, setRecordedVideoUrl] = useState<string>()
    const [uploadName, setUploadName] = useState<string>()
    const [uploadError, setUploadError] = useState<string>()

    useEffect(() => {
        streamRef.current = stream
        if (videoRef.current) videoRef.current.srcObject = stream
    }, [stream])

    useEffect(() => {
        recordedVideoUrlRef.current = recordedVideoUrl
    }, [recordedVideoUrl])

    useEffect(() => {
        if (!isRecording) return
        const interval = window.setInterval(() => setElapsedSeconds((value) => value + 1), 1000)
        return () => window.clearInterval(interval)
    }, [isRecording])

    // Cleanup HANYA saat komponen dilepas. Jangan tambahkan `stream` atau
    // `recordedVideoUrl` ke dependensi: cleanup akan ikut berjalan setiap state
    // itu berubah dan mematikan AudioContext serta loop pengukuran suara.
    useEffect(() => {
        return () => {
            streamRef.current?.getTracks().forEach((track) => track.stop())
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
            sourceRef.current?.disconnect()
            void audioContextRef.current?.close()
            if (recordedVideoUrlRef.current) URL.revokeObjectURL(recordedVideoUrlRef.current)
        }
    }, [])

    useEffect(() => {
        if (fetcher.data?.jobId) navigate(`/analisis/${fetcher.data.jobId}`)
    }, [fetcher.data, navigate])

    function stopAudioMeter() {
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
        sourceRef.current?.disconnect()
        sourceRef.current = null
        void audioContextRef.current?.close()
        audioContextRef.current = null
        analyserRef.current = null
        setAudioLevel(0)
    }

    function stopMedia() {
        streamRef.current?.getTracks().forEach((track) => track.stop())
        setStream(null)
        stopAudioMeter()
    }

    function measureAudio() {
        const analyser = analyserRef.current
        if (!analyser) return
        const now = performance.now()
        if (now - lastLevelUpdateRef.current >= audioLevelUpdateIntervalMs) {
            const values = new Uint8Array(analyser.fftSize)
            analyser.getByteTimeDomainData(values)
            const average = values.reduce((sum, value) => sum + Math.abs(value - 128), 0) / values.length
            setAudioLevel(Math.min(1, average / audioLevelDivisor))
            lastLevelUpdateRef.current = now
        }
        animationFrameRef.current = requestAnimationFrame(measureAudio)
    }

    async function requestMedia(consentGranted = consent) {
        if (consentGranted !== true) return
        if (!navigator.mediaDevices) {
            setPermission("denied")
            return
        }
        // Pastikan tidak ada stream atau loop lama yang tertinggal saat mencoba ulang.
        stopMedia()
        setPermission("pending")
        let nextStream: MediaStream | undefined
        try {
            nextStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            const audioContext = new AudioContext()
            const analyser = audioContext.createAnalyser()
            analyser.fftSize = 256
            // Simpan source di ref agar tidak dibersihkan garbage collector.
            const source = audioContext.createMediaStreamSource(nextStream)
            source.connect(analyser)
            await audioContext.resume()
            audioContextRef.current = audioContext
            analyserRef.current = analyser
            sourceRef.current = source
            setStream(nextStream)
            setPermission("granted")
            measureAudio()
        } catch {
            nextStream?.getTracks().forEach((track) => track.stop())
            setPermission("denied")
        }
    }

    function handleConsentChange(value: boolean | "indeterminate") {
        const nextConsent = value === true
        setConsent(nextConsent)
        if (nextConsent) {
            void requestMedia(true)
            return
        }
        if (isRecording) stopRecording()
        stopMedia()
        setPermission("idle")
    }

    function startRecording() {
        if (!stream || !("MediaRecorder" in window)) return
        chunksRef.current = []
        if (recordedVideoUrl) {
            URL.revokeObjectURL(recordedVideoUrl)
            setRecordedVideoUrl(undefined)
        }
        const recorder = new MediaRecorder(stream)
        recorder.ondataavailable = (event) => chunksRef.current.push(event.data)
        recorder.onstop = () => {
            const blob = new Blob(chunksRef.current, { type: recorder.mimeType })
            const durationSeconds = recordingStartedAtRef.current
                ? Math.round((Date.now() - recordingStartedAtRef.current) / 1000)
                : elapsedSeconds
            setRecordedVideoUrl(URL.createObjectURL(blob))
            const durationValid = durationSeconds >= minDurationSeconds && durationSeconds <= maxDurationSeconds
            setVideoReady(durationValid)
            if (!durationValid) {
                setUploadError("Durasi video harus antara 15–60 detik.")
            }
            recordingStartedAtRef.current = null
        }
        recorder.start()
        recorderRef.current = recorder
        recordingStartedAtRef.current = Date.now()
        setElapsedSeconds(0)
        setUploadError(undefined)
        setVideoReady(false)
        setIsRecording(true)
    }

    function stopRecording() {
        recorderRef.current?.stop()
        recorderRef.current = null
        setIsRecording(false)
    }

    async function handleUpload(file: File) {
        setUploadName(file.name)
        setUploadError(undefined)
        setVideoReady(false)
        if (!validateExtension(file)) {
            setUploadError("Format tidak didukung. Gunakan MP4, WebM, atau MOV.")
            return
        }
        if (file.size > maxFileSizeBytes) {
            setUploadError("Ukuran file terlalu besar. Maksimal 100 MB.")
            return
        }
        try {
            const duration = await readVideoDuration(file)
            if (duration < minDurationSeconds || duration > maxDurationSeconds) {
                setUploadError("Durasi video harus antara 15–60 detik.")
                return
            }
            setVideoReady(true)
        } catch (error) {
            setUploadError(error instanceof Error ? error.message : "Video tidak valid.")
        }
    }

    function submitAnalysis() {
        fetcher.submit(
            { consent: "true", video: uploadName ?? "rekaman-kamera.webm" },
            { method: "post", action: "/api/analyses" },
        )
    }

    const canStart = consent && videoReady && fetcher.state === "idle"

    return (
        <div className="flex flex-col gap-6">
            <header className="flex flex-col gap-2">
                <h1 className="text-2xl font-semibold min-[640px]:text-3xl">
                    <span className="min-[640px]:hidden">Analisis Kepribadian</span>
                    <span className="hidden min-[640px]:inline">Analisis Kepribadian dari Wajah & Suara</span>
                </h1>
                <p className="hidden text-muted-foreground min-[640px]:block">
                    Rekam langsung atau unggah video berdurasi 15–60 detik
                </p>
            </header>
            <div className="grid gap-6 min-[1024px]:grid-cols-[minmax(0,1fr)_18rem]">
                <Card>
                    <CardHeader><CardTitle>Input video</CardTitle></CardHeader>
                    <CardContent className="flex flex-col gap-6">
                        <Tabs value={mode} onValueChange={(value) => setMode(value as InputMode)}>
                            <TabsList className="w-full">
                                <TabsTrigger value="record"><span className="min-[640px]:hidden">Rekam</span><span className="hidden min-[640px]:inline">Rekam Langsung</span></TabsTrigger>
                                <TabsTrigger value="upload"><span className="min-[640px]:hidden">Unggah</span><span className="hidden min-[640px]:inline">Unggah Video</span></TabsTrigger>
                            </TabsList>
                            <TabsContent value="record" className="flex flex-col gap-4">
                                <CameraPreview videoRef={videoRef} permission={permission} isRecording={isRecording} elapsedSeconds={elapsedSeconds} recordedVideoUrl={recordedVideoUrl} onRetry={() => void requestMedia()} />
                                <AudioLevelMeter level={audioLevel} active={permission === "granted" && isRecording} />
                                <Button type="button" variant={isRecording ? "outline" : "default"} disabled={permission !== "granted" || (isRecording && elapsedSeconds === 0)} onClick={isRecording ? stopRecording : startRecording}>
                                    {isRecording ? "Berhenti" : "Mulai Merekam"}
                                </Button>
                            </TabsContent>
                            <TabsContent value="upload">
                                <UploadDropzone fileName={uploadName} error={uploadError} onFile={handleUpload} />
                            </TabsContent>
                        </Tabs>
                        <div className="flex items-start gap-3">
                            <Checkbox id="consent" checked={consent} onCheckedChange={handleConsentChange} />
                            <Label htmlFor="consent">Saya setuju data wajah & suara diproses untuk penelitian</Label>
                        </div>
                        {uploadError && mode === "record" && <Alert><AlertTitle>Video belum siap</AlertTitle><AlertDescription>{uploadError}</AlertDescription></Alert>}
                        {fetcher.data === undefined && fetcher.state === "idle" && fetcher.formData && <p role="alert">Analisis tidak dapat dimulai.</p>}
                        <Button type="button" size="lg" className="w-full" disabled={!canStart} onClick={submitAnalysis}>
                            {fetcher.state === "submitting" ? "Menyiapkan analisis..." : "Mulai Analisis ▶"}
                        </Button>
                        <p className="text-sm text-muted-foreground">Data hanya dipakai untuk penelitian dan dapat dihapus kapan saja.</p>
                    </CardContent>
                </Card>
                <GuidePanel />
            </div>
        </div>
    )
}