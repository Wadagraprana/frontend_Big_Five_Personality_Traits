import { useState, useRef } from "react"

import { Alert, AlertDescription } from "~/components/ui/alert"
import { Button } from "~/components/ui/button"

interface UploadDropzoneProps {
    fileName?: string
    error?: string
    onFile: (file: File) => void
}

export function UploadDropzone({ fileName, error, onFile }: UploadDropzoneProps) {
    const inputRef = useRef<HTMLInputElement>(null)
    const [isDragging, setIsDragging] = useState(false)

    function handleFiles(files: FileList | null) {
        const file = files?.[0]
        if (file) onFile(file)
    }

    return (
        <div className="space-y-3">
            <div
                className={`group relative flex min-h-60 flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center transition-colors cursor-pointer ${isDragging
                        ? "border-primary bg-secondary/80"
                        : "border-muted-foreground/25 bg-secondary/40 hover:bg-secondary/70"
                    }`}
                onDragOver={(event) => {
                    event.preventDefault()
                    setIsDragging(true)
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(event) => {
                    event.preventDefault()
                    setIsDragging(false)
                    handleFiles(event.dataTransfer.files)
                }}
                onClick={() => inputRef.current?.click()}
            >
                {/* Icon Visual */}
                <div className="mb-3 rounded-full border bg-background p-3 shadow-xs transition-transform group-hover:scale-105">
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
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" x2="12" y1="3" y2="15" />
                    </svg>
                </div>

                {/* Main Text & Format Info */}
                <div className="space-y-1">
                    <p className="text-sm font-medium">
                        Seret & lepas video ke sini, atau <span className="text-primary underline">pilih file</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                        Format MP4, WebM, atau MOV (Maksimal 100 MB)
                    </p>
                </div>

                <input
                    ref={inputRef}
                    className="sr-only"
                    aria-label="Pilih file video"
                    type="file"
                    accept=".mp4,.webm,.mov,video/mp4,video/webm,video/quicktime"
                    onChange={(event) => handleFiles(event.target.files)}
                />
            </div>

            {/* Indicator File Terpilih */}
            {fileName && (
                <div
                    aria-live="polite"
                    className="flex items-center justify-between rounded-md border bg-background px-3 py-2 text-sm"
                >
                    <div className="flex items-center gap-2 overflow-hidden">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="shrink-0 text-muted-foreground"
                        >
                            <polygon points="23 7 16 12 23 17 23 7" />
                            <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                        </svg>
                        <span className="truncate font-medium">{fileName}</span>
                    </div>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-auto p-1 text-xs text-muted-foreground hover:text-foreground"
                        onClick={(e) => {
                            e.stopPropagation()
                            inputRef.current?.click()
                        }}
                    >
                        Ganti
                    </Button>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <Alert variant="destructive" className="py-2">
                    <AlertDescription role="alert" className="text-xs">
                        {error}
                    </AlertDescription>
                </Alert>
            )}
        </div>
    )
}