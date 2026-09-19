import { ChartContainer, type ChartConfig } from "~/components/ui/chart"
import type { OceanScores } from "~/lib/ocean"
import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts"
import { traitItems } from "./trait-data"

const chartConfig = {
    score: { label: "Skor", color: "var(--primary)" },
} satisfies ChartConfig

export function OceanRadarChart({ scores }: { scores: OceanScores }) {
    const data = traitItems.map((trait) => ({
        trait: trait.label,
        score: scores[trait.key],
    }))

    return (
        <div aria-label="Radar chart skor OCEAN" role="img">
            <ChartContainer config={chartConfig} className="mx-auto aspect-square w-full max-w-96">
                <RadarChart data={data}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="trait" />
                    <Radar dataKey="score" fill="var(--color-score)" fillOpacity={0.25} stroke="var(--color-score)" />
                </RadarChart>
            </ChartContainer>
            <ul className="sr-only">
                {data.map((item) => <li key={item.trait}>{item.trait}: {item.score.toFixed(2)}</li>)}
            </ul>
        </div>
    )
}