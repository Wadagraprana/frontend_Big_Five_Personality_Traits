import { CheckIcon, Clock3Icon, LoaderCircleIcon, XIcon } from "lucide-react"

import type { PipelineStep } from "~/lib/ocean"

interface StepperProps {
    steps: PipelineStep[]
}

function StepIcon({ status }: { status: PipelineStep["status"] }) {
    if (status === "done") return <CheckIcon aria-label="Selesai" data-icon="inline-start" />
    if (status === "active") return <LoaderCircleIcon aria-label="Sedang berjalan" data-icon="inline-start" />
    if (status === "failed") return <XIcon aria-label="Gagal" data-icon="inline-start" />
    return <Clock3Icon aria-label="Menunggu" data-icon="inline-start" />
}

export function Stepper({ steps }: StepperProps) {
    return (
        <ol className="grid gap-3 min-[640px]:grid-cols-2 min-[1024px]:grid-cols-4">
            {steps.map((step) => (
                <li
                    key={step.key}
                    className={`flex items-center gap-2 rounded-lg border p-3 ${step.status === "active" ? "border-primary font-semibold" :
                            step.status === "done" ? "bg-primary text-primary-foreground" :
                                "bg-secondary text-muted-foreground"
                        }`}
                >
                    <StepIcon status={step.status} />
                    <span>{step.label}</span>
                </li>
            ))}
        </ol>
    )
}