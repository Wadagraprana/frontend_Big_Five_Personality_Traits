import { useEffect, useRef, useState } from "react"
import { useFetcher, useNavigate } from "react-router"
import { AudioLevelMeter } from "~/components/input/audio-level-meter"
import { CameraPreview } from "~/components/input/camera-preview"
import { GuidePanel } from "~/components/input/guide-panel"
import { UploadDropzone } from "~/components/input/upload-dropzone"
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert"
import { Button } from "~/components/ui/button"
import { Card, CardContent } from "~/components/ui/card"
import { Checkbox } from "~/components/ui/checkbox"
import { Label } from "~/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs"

type InputMode = "record" | "upload"
type PermissionState = "idle" | "pending" | "granted" | "denied"

const acceptedExtensions = ["mp4", "webm", "mov"]
const minDurationSeconds = 15
const maxDurationSeconds = 60
const maxFileSizeBytes = 100 * 1024 * 1024

const audioLevelDivisor = 16
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
        stopMedia()
        setPermission("pending")
        let nextStream: MediaStream | undefined
        try {
            nextStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            const audioContext = new AudioContext()
            const analyser = audioContext.createAnalyser()
            analyser.fftSize = 256
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
        <div className="mx-auto max-w-300 space-y-6">
            {/* Header dengan typography scale yang lebih terstruktur */}
            <header className="space-y-1">
                <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                    Analisis Kepribadian dari Wajah & Suara
                </h1>
                <p className="text-sm text-muted-foreground sm:text-base">
                    Rekam langsung atau unggah video berdurasi 15–60 detik untuk memulai pemrosesan data.
                </p>
            </header>

            {/* Layout Grid */}
            <div className="grid gap-6 lg:grid-cols-12">
                <div className="lg:col-span-8">
                    <Card className="rounded-none bg-transparent py-0 ring-0 min-[640px]:rounded-xl min-[640px]:bg-card min-[640px]:py-(--card-spacing) min-[640px]:ring-1 min-[640px]:ring-foreground/10 mb-4">
                        <CardContent className="space-y-2 px-0 min-[640px]:px-(--card-spacing)">
                            <Tabs value={mode} onValueChange={(value) => setMode(value as InputMode)}>
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="record">Rekam Langsung</TabsTrigger>
                                    <TabsTrigger value="upload">Unggah Video</TabsTrigger>
                                </TabsList>

                                <TabsContent value="record" className="mt-4 space-y-4">
                                    <div className="overflow-hidden rounded-lg border bg-black/5">
                                        <CameraPreview
                                            videoRef={videoRef}
                                            permission={permission}
                                            isRecording={isRecording}
                                            elapsedSeconds={elapsedSeconds}
                                            recordedVideoUrl={recordedVideoUrl}
                                            onRetry={() => void requestMedia()}
                                        />
                                    </div>

                                    <AudioLevelMeter level={audioLevel} active={permission === "granted" && isRecording} />

                                    <Button
                                        type="button"
                                        variant={isRecording ? "destructive" : "default"}
                                        className="w-full"
                                        disabled={permission !== "granted" || (isRecording && elapsedSeconds === 0)}
                                        onClick={isRecording ? stopRecording : startRecording}
                                    >
                                        {isRecording ? "Berhenti Merekam" : "Mulai Merekam"}
                                    </Button>
                                </TabsContent>

                                <TabsContent value="upload" className="mt-4">
                                    <UploadDropzone fileName={uploadName} error={uploadError} onFile={handleUpload} />
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>

                    {/* Persetujuan & Notifikasi */}
                    <Card>
                        <CardContent className="space-y-2">
                            <div className="flex items-start space-x-2">
                                <Checkbox
                                    id="consent"
                                    checked={consent}
                                    onCheckedChange={handleConsentChange}
                                    className="mt-0.5"
                                />
                                <div className="space-y-1 leading-none">
                                    <Label htmlFor="consent" className="text-sm font-medium leading-snug cursor-pointer">
                                        Saya setuju data wajah & suara diproses untuk penelitian
                                    </Label>
                                    <p className="text-xs text-muted-foreground">
                                        Data hanya dipakai untuk penelitian dan dapat dihapus kapan saja.
                                    </p>
                                </div>
                            </div>
                            {uploadError && mode === "record" && (
                                <Alert variant="destructive">
                                    <AlertTitle>Video belum siap</AlertTitle>
                                    <AlertDescription>{uploadError}</AlertDescription>
                                </Alert>
                            )}

                            {fetcher.data === undefined && fetcher.state === "idle" && fetcher.formData && (
                                <Alert variant="destructive">
                                    <AlertDescription>Analisis tidak dapat dimulai.</AlertDescription>
                                </Alert>
                            )}

                            <Button
                                type="button"
                                className="w-full"
                                disabled={!canStart}
                                onClick={submitAnalysis}
                            >
                                {fetcher.state === "submitting" ? "Menyiapkan analisis..." : "Mulai Analisis"}
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Panel Panduan Samping */}
                <div className="lg:col-span-4">
                    <GuidePanel />
                </div>
            </div>
        </div>
    )
}