import type { Route } from "./+types/result-report"

export async function loader(_: Route.LoaderArgs) {
    const pdfPlaceholder = "%PDF-1.4\n% Mock report OCEAN Predictor\n"
    return new Response(pdfPlaceholder, {
        headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": "attachment; filename=laporan-ocean.pdf",
        },
    })
}