import Image from "next/image"

// Dark full-screen card used by sign-in, 2FA and first-time setup.
export function AuthCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-forest flex items-center justify-center px-4 py-16">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-grid" />
        <div className="aurora w-[520px] h-[520px] -top-48 -right-40" />
        <div className="aurora aurora-sage w-[460px] h-[460px] -bottom-56 -left-40" />
      </div>
      <div className="relative w-full max-w-sm">
        <Image src="/brand/header-logo-dark-mode.svg" alt="CodeMotive" width={175} height={32} priority className="h-8 w-auto mx-auto mb-8" />
        <div className="glass gradient-border rounded-3xl p-7 sm:p-8 theme-dark">
          <h1 className="font-heading font-bold text-2xl text-white mb-1">{title}</h1>
          <p className="text-sm text-mint mb-6">{subtitle}</p>
          {children}
        </div>
      </div>
    </main>
  )
}

export const authInput =
  "w-full rounded-xl border border-sage/40 bg-forest/70 px-4 py-3 text-neutral focus:border-mint focus:outline-none"
export const authLabel = "block text-sm font-semibold text-mint mb-2"
export const authButton =
  "btn-shine w-full inline-flex items-center justify-center gap-2 rounded-xl bg-mint px-5 py-3 font-semibold text-forest glow-mint disabled:opacity-70"
