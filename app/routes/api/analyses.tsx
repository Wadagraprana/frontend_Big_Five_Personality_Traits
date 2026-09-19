import type { Route } from "./+types/analyses"
import { createAnalysis } from "~/lib/mock-api"

export async function action({ request }: Route.ActionArgs) {
    if (request.method !== "POST") {
        throw new Response("Metode tidak didukung.", { status: 405 })
    }

    const formData = await request.formData()
    const consent = formData.get("consent") === "true"
    return Response.json(await createAnalysis(consent), { status: 201 })
}