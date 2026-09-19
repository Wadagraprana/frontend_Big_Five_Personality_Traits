import type { Route } from "./+types/analysis"

import { ProcessScreen } from "~/components/process/process-screen"
import { getAnalysis } from "~/lib/mock-api"

export async function loader({ params }: Route.LoaderArgs) {
    try {
        return await getAnalysis(params.jobId || "")
    } catch (error) {
        throw new Response(error instanceof Error ? error.message : "Analisis tidak ditemukan.", { status: 404 })
    }
}

export default function Analysis({ loaderData }: Route.ComponentProps) {
    return <ProcessScreen initialJob={loaderData} />
}