'use client'

import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'

type Locale = 'es' | 'en'

type Alert = { id: string; walletKey: string; type: 'usd' | 'pct'; direction: 'above' | 'below'; value: number; triggered: boolean }

const T = {
  es: {
    type: 'Tipo:',
    condition: 'Condición:',
    value: 'Valor:',
    placeholder: 'Ingresa el valor',
    create: 'Crear',
    cancel: 'Cancelar',
    usd: 'USD',
    pct: '%',
    above: 'Arriba',
    below: 'Abajo',
  },
  en: {
    type: 'Type:',
    condition: 'Condition:',
    value: 'Value:',
    placeholder: 'Enter value',
    create: 'Create',
    cancel: 'Cancel',
    usd: 'USD',
    pct: '%',
    above: 'Above',
    below: 'Below',
  },
} as const

export function AlertForm({
  walletKey,
  onAdd,
  onCancel,
  locale = 'es',
}: {
  walletKey: string
  onAdd: (alert: Omit<Alert, 'id' | 'triggered'>) => void
  onCancel: () => void
  locale?: Locale
}) {
  const [type, setType] = useState<'usd' | 'pct'>('usd')
  const [direction, setDirection] = useState<'above' | 'below'>('above')
  const [value, setValue] = useState('')
  const t = T[locale]

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!value || Number.isNaN(Number(value))) return

    onAdd({
      walletKey,
      type,
      direction,
      value: Number(value),
    })

    setValue('')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">{t.type}</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as 'usd' | 'pct')}
            className="w-full rounded border bg-background px-2 py-1 text-xs"
          >
            <option value="usd">{t.usd}</option>
            <option value="pct">{t.pct}</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">{t.condition}</label>
          <select
            value={direction}
            onChange={(e) => setDirection(e.target.value as 'above' | 'below')}
            className="w-full rounded border bg-background px-2 py-1 text-xs"
          >
            <option value="above">{t.above}</option>
            <option value="below">{t.below}</option>
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">{t.value}</label>
        <input
          type="number"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={t.placeholder}
          step="any"
          className="w-full rounded border bg-background px-2 py-1 text-xs"
          autoFocus
        />
      </div>

      <div className="flex gap-1 pt-1">
        <Button type="submit" size="sm" variant="default" className="flex-1 text-xs" disabled={!value || Number.isNaN(Number(value))}>
          {t.create}
        </Button>
        <Button type="button" size="sm" variant="outline" className="flex-1 text-xs" onClick={onCancel}>
          {t.cancel}
        </Button>
      </div>
    </form>
  )
}
