import { ArrowLeftIcon } from "lucide-react"
import { Link, NavLink, useLocation } from "react-router"

import { Button } from "~/components/ui/button"

export function AppShell({ children }: { children: React.ReactNode }) {
    const location = useLocation()
    const isAnalysisPage = location.pathname.startsWith("/analisis/")
    const isResultPage = location.pathname.startsWith("/hasil/")
    const isDetailPage = isAnalysisPage || isResultPage

    return (
        <div className="flex min-h-svh flex-col">
            <header className="border-b">
                <div className="mx-auto flex min-h-14 w-full max-w-300 items-center justify-between gap-4 px-4">
                    <div className="flex items-center gap-3">
                        {isDetailPage && (
                            <Button
                                aria-label="Kembali ke beranda"
                                nativeButton={false}
                                render={<Link to="/" />}
                                size="icon"
                                variant="ghost"
                            >
                                <ArrowLeftIcon data-icon="inline-start" />
                            </Button>
                        )}
                        <NavLink aria-label="OCEAN Predictor, Beranda" to="/" className="text-lg font-semibold">
                            OCEAN Predictor
                        </NavLink>
                    </div>
                </div>
            </header>
            <main className="mx-auto flex w-full max-w-300 flex-1 flex-col px-4 pb-6 pt-6">
                {children}
            </main>
        </div>
    )
}