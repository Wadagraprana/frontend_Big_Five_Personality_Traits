import type { Route } from "./+types/result.$id"
import { deleteResult, getResult } from "~/lib/mock-api"

export async function loader({ params }: Route.LoaderArgs) {
    if (!params.id) {
        throw new Response("ID hasil tidak ditemukan.", { status: 400 })
    }

    try {
        return Response.json(await getResult(params.id))
    } catch (error) {
        throw new Response(error instanceof Error ? error.message : "Hasil tidak ditemukan.", {
            status: 404,
        })
    }
}

export async function action({ request, params }: Route.ActionArgs) {
    if (request.method !== "DELETE" || !params.id) {
        throw new Response("Metode atau ID tidak valid.", { status: 400 })
    }

    return Response.json(await deleteResult(params.id))
}