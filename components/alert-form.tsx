'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

type Alert = { id: string; walletKey: string; type: 'usd' | 'pct'; direction: 'above' | 'below'; value: number; triggered: boolean }

export function AlertForm({
  walletKey,
  onAdd,
  onCancel,
}: {
  walletKey: string
  onAdd: (alert: Omit<Alert, 'id' | 'triggered'>) => void
  onCancel: () => void
}) {
  const [type, setType] = useState<'usd' | 'pct'>('usd')
  const [direction, setDirection] = useState<'above' | 'below'>('above')
  const [value, setValue] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!value || isNaN(Number(value))) return

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
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Tipo:</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as 'usd' | 'pct')}
            className="w-full rounded border bg-background px-2 py-1 text-xs"
          >
            <option value="usd">USD</option>
            <option value="pct">%</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Condición:</label>
          <select
            value={direction}
            onChange={(e) => setDirection(e.target.value as 'above' | 'below')}
            className="w-full rounded border bg-background px-2 py-1 text-xs"
          >
            <option value="above">Arriba</option>
            <option value="below">Abajo</option>
          </select>
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">Valor:</label>
        <input
          type="number"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Ingresa el valor"
          step="any"
          className="w-full rounded border bg-background px-2 py-1 text-xs"
          autoFocus
        />
      </div>

      <div className="flex gap-1 pt-1">
        <Button
          type="submit"
          size="sm"
          variant="default"
          className="flex-1 text-xs"
          disabled={!value || isNaN(Number(value))}
        >
          Crear
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="flex-1 text-xs"
          onClick={onCancel}
        >
          Cancelar
        </Button>
      </div>
    </form>
  )
}
