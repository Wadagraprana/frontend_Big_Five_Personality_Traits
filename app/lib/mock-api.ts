import type { JobStatus, OceanResult, PipelineStep } from "./ocean"

const pipelineSteps: PipelineStep[] = [
    { key: "extract", label: "Ekstrak frame & audio", status: "active" },
    { key: "aggregate", label: "Multi-frame aggregation", status: "pending" },
    {
        key: "encode",
        label: "Swin Transformer + fitur suara",
        status: "pending",
    },
    { key: "fuse", label: "Fusi & prediksi OCEAN", status: "pending" },
]

const jobs = new Map<string, JobStatus>()
const jobStartedAt = new Map<string, number>()
const results = new Map<string, OceanResult>()

function cloneSteps(steps: PipelineStep[]) {
    return steps.map((step) => ({ ...step }))
}

function createId(prefix: string) {
    return `${prefix}-${crypto.randomUUID()}`
}

function createSampleResult(id = createId("result")): OceanResult {
    return {
        id,
        createdAt: new Date().toISOString(),
        scores: {
            openness: 0.72,
            conscientiousness: 0.58,
            extraversion: 0.41,
            agreeableness: 0.66,
            neuroticism: 0.33,
        },
        framesUsed: 16,
        durationSeconds: 32,
    }
}

function advanceJob(job: JobStatus, startedAt: number): JobStatus {
    if (job.state !== "running") {
        return job
    }

    const progress = Math.min(100, Math.floor((Date.now() - startedAt) / 100))
    const activeStep = Math.min(3, Math.floor(progress / 25))
    const steps = job.steps.map((step, index) => ({
        ...step,
        status:
            index < activeStep
                ? "done"
                : index === activeStep
                    ? "active"
                    : "pending",
    })) as PipelineStep[]

    if (progress >= 100) {
        const result = createSampleResult()
        results.set(result.id, result)
        return {
            ...job,
            state: "completed",
            progress: 100,
            etaSeconds: undefined,
            steps: steps.map((step) => ({ ...step, status: "done" })),
            result,
        }
    }

    return {
        ...job,
        progress,
        etaSeconds: Math.max(1, Math.ceil((100 - progress) / 10)),
        steps,
    }
}

export async function createAnalysis(consent: boolean) {
    if (!consent) {
        throw new Error("Persetujuan diperlukan sebelum analisis dimulai.")
    }

    const jobId = createId("job")
    jobs.set(jobId, {
        jobId,
        state: "running",
        progress: 0,
        etaSeconds: 24,
        steps: cloneSteps(pipelineSteps),
    })
    jobStartedAt.set(jobId, Date.now())

    return { jobId }
}

export async function getAnalysis(jobId: string) {
    const job = jobs.get(jobId)

    if (!job) {
        throw new Error("Analisis tidak ditemukan.")
    }

    const advancedJob = advanceJob(job, jobStartedAt.get(jobId) ?? Date.now())
    jobs.set(jobId, advancedJob)
    return { ...advancedJob, steps: cloneSteps(advancedJob.steps) }
}

export async function cancelAnalysis(jobId: string) {
    const job = jobs.get(jobId)

    if (!job) {
        throw new Error("Analisis tidak ditemukan.")
    }

    const cancelledJob: JobStatus = {
        ...job,
        state: "cancelled",
        etaSeconds: undefined,
        steps: cloneSteps(job.steps),
    }
    jobs.set(jobId, cancelledJob)
    jobStartedAt.delete(jobId)

    return cancelledJob
}

export async function listResults() {
    if (results.size === 0) {
        const sample = createSampleResult("result-demo")
        results.set(sample.id, sample)
    }

    return Array.from(results.values())
}

export async function getResult(resultId: string) {
    const result = results.get(resultId)

    if (!result) {
        throw new Error("Hasil tidak ditemukan.")
    }

    return result
}

export async function deleteResult(resultId: string) {
    results.delete(resultId)
    return { success: true }
}

export async function completeAnalysis(jobId: string) {
    const job = jobs.get(jobId)

    if (!job) {
        throw new Error("Analisis tidak ditemukan.")
    }

    const result = createSampleResult()
    results.set(result.id, result)
    const completedJob: JobStatus = {
        ...job,
        state: "completed",
        progress: 100,
        etaSeconds: undefined,
        steps: job.steps.map((step) => ({ ...step, status: "done" })),
        result,
    }
    jobs.set(jobId, completedJob)
    jobStartedAt.delete(jobId)

    return completedJob
}