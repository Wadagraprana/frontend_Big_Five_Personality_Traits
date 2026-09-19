import type { TraitKey } from "~/lib/ocean"

export const traitItems: Array<{ key: TraitKey; label: string; descriptions: { low: string; medium: string; high: string } }> = [
    {
        key: "openness",
        label: "Openness",
        descriptions: { low: "Cenderung menyukai hal yang familier.", medium: "Terbuka pada sebagian gagasan dan pengalaman baru.", high: "Cenderung ingin tahu dan menikmati gagasan baru." },
    },
    {
        key: "conscientiousness",
        label: "Conscientiousness",
        descriptions: { low: "Cenderung fleksibel terhadap rencana dan rutinitas.", medium: "Menyeimbangkan spontanitas dengan perencanaan.", high: "Cenderung teratur, tekun, dan berorientasi pada tujuan." },
    },
    {
        key: "extraversion",
        label: "Extraversion",
        descriptions: { low: "Cenderung nyaman dengan suasana tenang dan refleksi pribadi.", medium: "Menikmati perpaduan interaksi sosial dan waktu sendiri.", high: "Cenderung berenergi saat berinteraksi dengan orang lain." },
    },
    {
        key: "agreeableness",
        label: "Agreeableness",
        descriptions: { low: "Cenderung tegas dalam menyampaikan pendapat.", medium: "Menyeimbangkan ketegasan dengan pertimbangan terhadap orang lain.", high: "Cenderung kooperatif, hangat, dan mempertimbangkan perasaan orang lain." },
    },
    {
        key: "neuroticism",
        label: "Neuroticism",
        descriptions: { low: "Cenderung tetap tenang saat menghadapi tekanan.", medium: "Respons terhadap tekanan dapat berubah sesuai situasi.", high: "Cenderung lebih peka terhadap tekanan atau emosi yang kuat." },
    },
]

export function getTraitLevel(score: number) {
    if (score < 0.34) return "low" as const
    if (score < 0.67) return "medium" as const
    return "high" as const
}