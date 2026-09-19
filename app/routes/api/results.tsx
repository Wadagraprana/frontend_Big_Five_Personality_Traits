import type { Route } from "./+types/results"
import { listResults } from "~/lib/mock-api"

export async function loader(_: Route.LoaderArgs) {
    return Response.json(await listResults())
}