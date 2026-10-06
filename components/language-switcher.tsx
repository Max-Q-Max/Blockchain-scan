'use client'

import { Languages } from 'lucide-react'
import { useLocale } from '@/lib/i18n'

export function LanguageSwitcher() {
  const { locale, setLocale } = useLocale()

  return (
    <div className="inline-flex items-center gap-1 rounded-md border bg-card p-0.5 text-xs">
      <Languages className="ml-1.5 size-3.5 text-muted-foreground" aria-hidden="true" />
      <button
        type="button"
        onClick={() => setLocale('es')}
        className={`rounded px-2 py-1 font-medium transition-colors ${
          locale === 'es' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
        }`}
        aria-pressed={locale === 'es'}
        title="Español"
      >
        ES
      </button>
      <button
        type="button"
        onClick={() => setLocale('en')}
        className={`rounded px-2 py-1 font-medium transition-colors ${
          locale === 'en' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
        }`}
        aria-pressed={locale === 'en'}
        title="English"
      >
        EN
      </button>
    </div>
  )
}