import type { Route } from "./+types/result"

import { ResultScreen } from "~/components/result/result-screen"
import { getResult } from "~/lib/mock-api"

export async function loader({ params }: Route.LoaderArgs) {
    try {
        return await getResult(params.id)
    } catch (error) {
        throw new Response(error instanceof Error ? error.message : "Hasil tidak ditemukan.", { status: 404 })
    }
}

export default function Result({ loaderData }: Route.ComponentProps) {
    return <ResultScreen result={loaderData} />
}