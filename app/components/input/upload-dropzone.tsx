import { useRef } from "react"

import { Button } from "~/components/ui/button"

interface UploadDropzoneProps {
    fileName?: string
    error?: string
    onFile: (file: File) => void
}

export function UploadDropzone({ fileName, error, onFile }: UploadDropzoneProps) {
    const inputRef = useRef<HTMLInputElement>(null)

    function handleFiles(files: FileList | null) {
        const file = files?.[0]
        if (file) onFile(file)
    }

    return (
        <div
            className="flex min-h-56 flex-col items-center justify-center gap-3 rounded-lg border border-dashed bg-secondary p-6 text-center"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
                event.preventDefault()
                handleFiles(event.dataTransfer.files)
            }}
        >
            <p>Seret video ke sini atau pilih file dari perangkat.</p>
            <p className="text-sm text-muted-foreground">MP4, WebM, atau MOV. Maksimal 100 MB.</p>
            <input
                ref={inputRef}
                className="sr-only"
                aria-label="Pilih file video"
                type="file"
                accept=".mp4,.webm,.mov,video/mp4,video/webm,video/quicktime"
                onChange={(event) => handleFiles(event.target.files)}
            />
            <Button type="button" variant="outline" onClick={() => inputRef.current?.click()}>
                Pilih file
            </Button>
            {fileName && <p aria-live="polite">File dipilih: {fileName}</p>}
            {error && <p role="alert">{error}</p>}
        </div>
    )
}