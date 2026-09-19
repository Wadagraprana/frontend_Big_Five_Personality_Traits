import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"

export function FramePreviewCard() {
    return (
        <Card>
            <CardHeader><CardTitle>Frame terpilih (N = 16)</CardTitle></CardHeader>
            <CardContent>
                <div className="flex aspect-video items-center justify-center rounded-lg bg-secondary text-4xl" aria-label="Pratinjau frame terpilih">
                    ◎
                </div>
            </CardContent>
        </Card>
    )
}

export function SpectrogramCard() {
    return (
        <Card>
            <CardHeader><CardTitle>Mel-spectrogram suara</CardTitle></CardHeader>
            <CardContent>
                <div className="flex h-40 items-end gap-1 rounded-lg bg-secondary p-4" aria-label="Pratinjau mel-spectrogram">
                    {[30, 55, 42, 78, 64, 88, 48, 70, 36, 62, 82, 50, 73, 44, 90, 58].map((height, index) => (
                        <span key={index} className="flex-1 bg-primary" style={{ height: `${height}%` }} />
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}