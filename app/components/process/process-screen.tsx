import { useEffect, useState } from "react"
import { useFetcher, useNavigate } from "react-router"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "~/components/ui/accordion"
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert"
import { Button } from "~/components/ui/button"
import { Progress, ProgressLabel, ProgressValue } from "~/components/ui/progress"
import { FramePreviewCard, SpectrogramCard } from "~/components/process/media-cards"
import { Stepper } from "~/components/process/stepper"
import type { JobStatus } from "~/lib/ocean"

interface ProcessScreenProps {
    initialJob: JobStatus
}

export function ProcessScreen({ initialJob }: ProcessScreenProps) {
    const navigate = useNavigate()
    const cancelFetcher = useFetcher<JobStatus>()
    const [job, setJob] = useState(initialJob)

    useEffect(() => {
        if (job.state === "completed" && job.result) {
            navigate(`/hasil/${job.result.id}`, { replace: true })
        }
    }, [job, navigate])

    useEffect(() => {
        if (job.state !== "running") return
        const interval = window.setInterval(async () => {
            const response = await fetch(`/api/analyses/${job.jobId}`)
            if (response.ok) setJob(await response.json() as JobStatus)
        }, 1500)
        return () => window.clearInterval(interval)
    }, [job.jobId, job.state])

    useEffect(() => {
        if (cancelFetcher.data?.state === "cancelled") navigate("/", { replace: true })
    }, [cancelFetcher.data, navigate])

    function cancel() {
        cancelFetcher.submit(null, { method: "delete", action: `/api/analyses/${job.jobId}` })
    }

    if (job.state === "failed") {
        return (
            <div className="flex flex-col gap-6">
                <h1 className="text-2xl font-semibold">Memproses Data…</h1>
                <Alert>
                    <AlertTitle>Analisis gagal</AlertTitle>
                    <AlertDescription>{job.error ?? "Terjadi kesalahan saat memproses data."}</AlertDescription>
                </Alert>
                <Button type="button" onClick={() => navigate("/")}>Coba lagi</Button>
            </div>
        )
    }

    const details = (
        <div className="grid gap-4 min-[1024px]:grid-cols-2">
            <FramePreviewCard />
            <SpectrogramCard />
        </div>
    )

    return (
        <div className="flex flex-col gap-6">
            <header className="flex flex-col gap-2">
                <h1 className="text-2xl font-semibold">Memproses Data…</h1>
                <p aria-live="polite" className="text-muted-foreground">
                    Analisis sedang berjalan. Anda dapat membatalkannya kapan saja.
                </p>
            </header>
            <Stepper steps={job.steps} />
            <Progress value={job.progress} aria-label="Kemajuan analisis">
                <ProgressLabel>Kemajuan analisis</ProgressLabel>
                <ProgressValue>{(formattedValue) => `${formattedValue ?? Math.round(job.progress)}%`}</ProgressValue>
            </Progress>
            <p aria-live="polite" className="text-sm text-muted-foreground">
                {job.progress}% — perkiraan sisa waktu ± {job.etaSeconds ?? 0} detik
            </p>
            <div className="min-[640px]:hidden">
                <Accordion defaultValue={[]}>
                    <AccordionItem value="details">
                        <AccordionTrigger>Lihat frame & spektrogram</AccordionTrigger>
                        <AccordionContent>{details}</AccordionContent>
                    </AccordionItem>
                </Accordion>
            </div>
            <div className="hidden min-[640px]:block">{details}</div>
            <Button type="button" variant="outline" disabled={cancelFetcher.state !== "idle"} onClick={cancel}>
                {cancelFetcher.state === "submitting" ? "Membatalkan..." : "Batal"}
            </Button>
        </div>
    )
}