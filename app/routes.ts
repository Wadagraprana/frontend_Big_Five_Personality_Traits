import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
    index("routes/home.tsx"),
    route("analisis/:jobId", "routes/analysis.tsx"),
    route("hasil/:id", "routes/result.tsx"),
    route("riwayat", "routes/history.tsx"),
    route("tentang", "routes/about.tsx"),
    route("api/analyses", "routes/api/analyses.tsx"),
    route("api/analyses/:jobId", "routes/api/analysis.$jobId.tsx"),
    route("api/results", "routes/api/results.tsx"),
    route("api/results/:id", "routes/api/result.$id.tsx"),
    route("api/results/:id/report.pdf", "routes/api/result-report.tsx"),
] satisfies RouteConfig;
