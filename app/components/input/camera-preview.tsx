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
                        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 p-4 text-center">
                            <div className="aspect-3/4 w-1/2 max-w-56 rounded-[50%] border-2 border-primary" />
                            <p className="bg-background/80 px-2 py-1 text-sm">Posisikan wajah di tengah</p>
                        </div>
                    </>
                )}
                {permission === "pending" && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/80 p-4 text-center">
                        Meminta izin kamera dan mikrofon...
                    </div>
                )}
                {permission === "idle" && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/80 p-4 text-center">
                        Setujui pemrosesan untuk mengaktifkan kamera dan mikrofon.
                    </div>
                )}
            </div>
            {permission === "denied" && (
                <Alert>
                    <AlertTitle>Izin kamera atau mikrofon ditolak</AlertTitle>
                    <AlertDescription className="flex flex-col gap-2">
                        Izinkan akses di pengaturan browser atau gunakan tab Unggah Video.
                        <Button type="button" variant="outline" onClick={onRetry}>
                            Coba lagi
                        </Button>
                    </AlertDescription>
                </Alert>
            )}
            {permission === "granted" && (
                <p aria-live="polite" className="text-sm text-muted-foreground">
                    {isRecording
                        ? `Merekam ${Math.floor(elapsedSeconds / 60)}:${String(elapsedSeconds % 60).padStart(2, "0")}`
                        : "Kamera siap digunakan."}
                </p>
            )}
        </div>
    )
}