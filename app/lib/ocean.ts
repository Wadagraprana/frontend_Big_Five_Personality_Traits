export type TraitKey =
    | "openness"
    | "conscientiousness"
    | "extraversion"
    | "agreeableness"
    | "neuroticism"

export interface OceanScores {
    openness: number
    conscientiousness: number
    extraversion: number
    agreeableness: number
    neuroticism: number
}

export interface OceanResult {
    id: string
    createdAt: string
    scores: OceanScores
    framesUsed: number
    durationSeconds: number
}

export type PipelineStepStatus = "pending" | "active" | "done" | "failed"

export interface PipelineStep {
    key: "extract" | "aggregate" | "encode" | "fuse"
    label: string
    status: PipelineStepStatus
}

export interface JobStatus {
    jobId: string
    state: "running" | "completed" | "failed" | "cancelled"
    progress: number
    etaSeconds?: number
    steps: PipelineStep[]
    result?: OceanResult
    error?: string
}