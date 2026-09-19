import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "~/components/ui/accordion"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import type { OceanScores } from "~/lib/ocean"
import { getTraitLevel, traitItems } from "./trait-data"

function InterpretationList({ scores }: { scores: OceanScores }) {
    return (
        <div className="flex flex-col gap-4">
            {traitItems.map((trait) => {
                const level = getTraitLevel(scores[trait.key])
                return (
                    <div key={trait.key} className="flex flex-col gap-1">
                        <h3 className="font-medium">{trait.label} · {level === "low" ? "rendah" : level === "medium" ? "sedang" : "tinggi"}</h3>
                        <p className="text-sm text-muted-foreground">{trait.descriptions[level]}</p>
                    </div>
                )
            })}
        </div>
    )
}

export function InterpretationCard({ scores }: { scores: OceanScores }) {
    const highest = traitItems.reduce((best, trait) => scores[trait.key] > scores[best.key] ? trait : best, traitItems[0])
    return (
        <>
            <Card className="hidden min-[640px]:flex">
                <CardHeader><CardTitle>Interpretasi</CardTitle></CardHeader>
                <CardContent className="flex flex-col gap-4">
                    <p>Skor tertinggi terlihat pada {highest.label} ({scores[highest.key].toFixed(2)}).</p>
                    <InterpretationList scores={scores} />
                </CardContent>
            </Card>
            <Accordion className="min-[640px]:hidden">
                <AccordionItem value="interpretation">
                    <AccordionTrigger>Interpretasi per trait & catatan</AccordionTrigger>
                    <AccordionContent className="flex flex-col gap-4">
                        <p>Skor tertinggi terlihat pada {highest.label} ({scores[highest.key].toFixed(2)}).</p>
                        <Accordion>
                            {traitItems.map((trait) => {
                                const level = getTraitLevel(scores[trait.key])
                                return (
                                    <AccordionItem key={trait.key} value={trait.key}>
                                        <AccordionTrigger>{trait.label} · {level === "low" ? "rendah" : level === "medium" ? "sedang" : "tinggi"}</AccordionTrigger>
                                        <AccordionContent>{trait.descriptions[level]}</AccordionContent>
                                    </AccordionItem>
                                )
                            })}
                        </Accordion>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </>
    )
}