import { Progress } from "~/components/ui/progress"

interface AudioLevelMeterProps {
    level: number
    active: boolean
}

export function AudioLevelMeter({ level, active }: AudioLevelMeterProps) {
    const percent = active ? Math.round(Math.min(1, Math.max(0, level)) * 100) : 0

    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3 text-sm">
                <span>Level suara</span>
                <span className="text-muted-foreground">
                    {active ? `${percent}%` : "Tidak aktif"}
                </span>
            </div>
            <Progress aria-label="Level suara" value={percent} />
        </div>
    )
}