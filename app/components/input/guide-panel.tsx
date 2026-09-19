import { InfoIcon } from "lucide-react"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "~/components/ui/accordion"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"

const guideItems = [
    "Pastikan pencahayaan cukup.",
    "Gunakan ruangan yang tenang.",
    "Bicara selama 15–60 detik.",
    "Pastikan wajah terlihat jelas.",
    "Izinkan kamera dan mikrofon setelah memberi persetujuan.",
]

function GuideList() {
    return (
        <ul className="flex list-disc flex-col gap-2 ps-5">
            {guideItems.map((item) => <li key={item}>{item}</li>)}
        </ul>
    )
}

export function GuidePanel() {
    return (
        <>
            <Card className="hidden min-[1024px]:flex">
                <CardHeader>
                    <CardTitle>Panduan</CardTitle>
                </CardHeader>
                <CardContent>
                    <GuideList />
                </CardContent>
            </Card>
            <Accordion className="min-[1024px]:hidden" defaultValue={[]}>
                <AccordionItem value="guide">
                    <AccordionTrigger>
                        <span className="flex items-center gap-2"><InfoIcon data-icon="inline-start" />Panduan</span>
                    </AccordionTrigger>
                    <AccordionContent><GuideList /></AccordionContent>
                </AccordionItem>
            </Accordion>
        </>
    )
}