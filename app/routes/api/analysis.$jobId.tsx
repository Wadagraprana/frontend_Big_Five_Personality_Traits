import type { Route } from "./+types/analysis.$jobId"
import { cancelAnalysis, getAnalysis } from "~/lib/mock-api"

export async function loader({ params }: Route.LoaderArgs) {
    if (!params.jobId) {
        throw new Response("ID analisis tidak ditemukan.", { status: 400 })
    }

    try {
        return Response.json(await getAnalysis(params.jobId))
    } catch (error) {
        throw new Response(error instanceof Error ? error.message : "Analisis tidak ditemukan.", {
            status: 404,
        })
    }
}

export async function action({ request, params }: Route.ActionArgs) {
    if (request.method !== "DELETE" || !params.jobId) {
        throw new Response("Metode atau ID tidak valid.", { status: 400 })
    }

    try {
        return Response.json(await cancelAnalysis(params.jobId))
    } catch (error) {
        throw new Response(error instanceof Error ? error.message : "Analisis tidak ditemukan.", {
            status: 404,
        })
    }
}