import { Progress } from "~/components/ui/progress"
import type { OceanScores } from "~/lib/ocean"
import { traitItems } from "./trait-data"

export function TraitBars({ scores }: { scores: OceanScores }) {
    return (
        <div className="flex flex-col gap-4" aria-label="Daftar skor OCEAN">
            {traitItems.map((trait) => {
                const score = scores[trait.key]
                return (
                    <div key={trait.key} className="flex flex-col gap-2">
                        <div className="flex items-center justify-between gap-3">
                            <span>{trait.label}</span>
                            <span className="tabular-nums">{score.toFixed(2)}</span>
                        </div>
                        <Progress aria-label={`Skor ${trait.label}: ${score.toFixed(2)}`} value={score * 100} />
                    </div>
                )
            })}
        </div>
    )
}