import type { RefObject } from "react"

import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert"
import { Button } from "~/components/ui/button"

type PermissionState = "idle" | "pending" | "granted" | "denied"

interface CameraPreviewProps {
    videoRef: RefObject<HTMLVideoElement | null>
    permission: PermissionState
    isRecording: boolean
    elapsedSeconds: number
    recordedVideoUrl?: string
    onRetry: () => void
}

function formatDuration(seconds: number) {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
}

export function CameraPreview({
    videoRef,
    permission,
    isRecording,
    elapsedSeconds,
    recordedVideoUrl,
    onRetry,
}: CameraPreviewProps) {
    return (
        <div className="flex flex-col gap-3">
            <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-lg border bg-secondary">
                {recordedVideoUrl ? (
                    <video
                        src={recordedVideoUrl}
                        aria-label="Rekaman video"
                        controls
                        playsInline
                        className="size-full object-cover"
                    />
                ) : (
                    <>
                        <video
                            ref={videoRef}
                            aria-label="Pratinjau kamera"
                            autoPlay
                            muted
                            playsInline
                            className="size-full object-cover"
                        />

                        {/* Overlay Indikator Status & Timer */}
                        {permission === "granted" && (
                            <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                                {isRecording ? (
                                    <div className="flex items-center gap-2 rounded-full bg-background/90 px-3 py-1 text-xs font-semibold backdrop-blur-md shadow-sm border border-border">
                                        <span className="relative flex h-2.5 w-2.5">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-destructive"></span>
                                        </span>
                                        <span className="text-destructive">REC</span>
                                        <span className="text-foreground/40">|</span>
                                        <span className="font-mono text-foreground">{formatDuration(elapsedSeconds)}</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-1.5 rounded-full bg-background/80 px-2.5 py-1 text-xs font-medium backdrop-blur-md border border-border/50 text-muted-foreground">
                                        <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                                        Kamera Siap
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Frame Wajah Responsif dengan Feedback Visual */}
                        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 p-2 sm:gap-3 sm:p-4 text-center">
                            <div
                                className={`aspect-3/4 w-[38%] min-w-30 max-w-50 sm:w-[45%] sm:max-w-55 rounded-[50%] border-2 transition-all duration-300 border-primary/80 border-dashed`}
                            />
                            <p className="rounded-full bg-background/85 px-3 py-1 text-xs font-medium backdrop-blur-md border border-border/50 shadow-xs sm:text-sm">
                                {isRecording ? "Tetap tatap kamera" : "Posisikan wajah di dalam oval"}
                            </p>
                        </div>
                    </>
                )}

                {/* State Overlay saat Meminta Izin / Idle */}
                {permission === "pending" && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/85 p-4 text-center backdrop-blur-xs">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        <p className="text-sm font-medium sm:text-base">Meminta izin kamera dan mikrofon...</p>
                    </div>
                )}

                {permission === "idle" && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/85 p-4 text-center backdrop-blur-xs">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-muted-foreground"
                        >
                            <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
                            <circle cx="12" cy="13" r="3" />
                        </svg>
                        <p className="text-sm text-muted-foreground sm:text-base max-w-xs">
                            Setujui pemrosesan di bawah untuk mengaktifkan pratinjau kamera.
                        </p>
                    </div>
                )}
            </div>

            {/* Alert Izin Ditolak */}
            {permission === "denied" && (
                <Alert variant="destructive">
                    <AlertTitle>Izin kamera atau mikrofon ditolak</AlertTitle>
                    <AlertDescription className="flex flex-col gap-2 pt-1">
                        <span>Izinkan akses perangkat di pengaturan browser atau gunakan opsi Unggah Video.</span>
                        <Button type="button" variant="outline" size="sm" onClick={onRetry} className="w-fit">
                            Coba lagi
                        </Button>
                    </AlertDescription>
                </Alert>
            )}
        </div>
    )
}