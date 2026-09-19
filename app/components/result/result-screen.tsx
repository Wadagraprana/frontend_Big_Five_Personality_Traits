import { DownloadIcon, SaveIcon } from "lucide-react"
import { useState } from "react"
import { useNavigate } from "react-router"
import { toast } from "sonner"

import { InterpretationCard } from "~/components/result/interpretation-card"
import { OceanRadarChart } from "~/components/result/radar-chart"
import { TraitBars } from "~/components/result/trait-bars"
import { Alert, AlertDescription } from "~/components/ui/alert"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import type { OceanResult } from "~/lib/ocean"

export function ResultScreen({ result }: { result: OceanResult }) {
    const navigate = useNavigate()
    const [saved, setSaved] = useState(false)

    function saveResult() {
        setSaved(true)
        toast.success("Hasil disimpan ke riwayat.")
    }

    function downloadReport() {
        window.location.assign(`/api/results/${result.id}/report.pdf`)
    }

    return (
        <div className="flex flex-col gap-6 pb-16 min-[640px]:pb-0">
            <header>
                <h1 className="text-2xl font-semibold">
                    <span className="min-[640px]:hidden">Hasil OCEAN</span>
                    <span className="hidden min-[640px]:inline">Hasil Prediksi Big Five (OCEAN)</span>
                </h1>
            </header>
            <div className="grid gap-6 min-[640px]:grid-cols-2 min-[1024px]:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                <Card className="order-2 min-[640px]:order-1">
                    <CardHeader><CardTitle>Skor OCEAN</CardTitle></CardHeader>
                    <CardContent><TraitBars scores={result.scores} /></CardContent>
                </Card>
                <Card className="order-1 min-[640px]:order-2">
                    <CardHeader><CardTitle>Profil kepribadian</CardTitle></CardHeader>
                    <CardContent><OceanRadarChart scores={result.scores} /></CardContent>
                </Card>
            </div>
            <InterpretationCard scores={result.scores} />
            <Alert>
                <AlertDescription>⚠ Hasil merupakan prediksi model penelitian, bukan diagnosis psikologis.</AlertDescription>
            </Alert>
            <div className="hidden items-center gap-3 min-[640px]:flex">
                <Button type="button" onClick={downloadReport}><DownloadIcon data-icon="inline-start" />Unduh PDF</Button>
                <Button type="button" variant="secondary" onClick={() => navigate("/")}>Analisis Ulang</Button>
                <Button type="button" variant="secondary" onClick={saveResult} disabled={saved}><SaveIcon data-icon="inline-start" />{saved ? "Tersimpan" : "Simpan ke Riwayat"}</Button>
            </div>
            <div className="fixed inset-x-0 bottom-0 z-40 flex gap-2 border-t bg-background p-3 min-[640px]:hidden">
                <Button type="button" className="flex-1" onClick={downloadReport}><DownloadIcon data-icon="inline-start" />Unduh PDF</Button>
                <Button type="button" variant="secondary" className="flex-1" onClick={saveResult} disabled={saved}><SaveIcon data-icon="inline-start" />{saved ? "Tersimpan" : "Simpan"}</Button>
            </div>
        </div>
    )
}