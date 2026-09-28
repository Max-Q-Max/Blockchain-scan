'use client'

import { useState } from 'react'
import { Loader2, Bell, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

type AlertDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  walletKey: string
  walletLabel: string
  chainSymbol: string
  currentPriceUsd: number | null
  currentBalanceUsd: number | null
  onAdd: (alert: Omit<Alert, 'id' | 'triggered'>) => void
}

type Alert = {
  id: string
  walletKey: string
  type: 'usd' | 'pct'
  direction: 'above' | 'below'
  value: number
  triggered: boolean
}

const T = {
  es: {
    title: 'Crear alerta',
    description: 'Recibe notificación cuando el valor supere o baje del umbral.',
    typeLabel: 'Tipo de alerta',
    typeUsd: 'Valor en USD',
    typePct: 'Variación % (24h)',
    directionLabel: 'Condición',
    above: 'Sobre',
    below: 'Bajo',
    valueLabel: 'Valor',
    valuePlaceholderUsd: 'ej. 5000',
    valuePlaceholderPct: 'ej. 10',
    currentPrice: 'Precio actual',
    currentValue: 'Valor actual',
    addAlert: 'Crear alerta',
    creating: 'Creando…',
    cancel: 'Cancelar',
    errorRequired: 'Completa todos los campos',
    errorNumber: 'Debe ser un número válido',
  },
  en: {
    title: 'Create alert',
    description: 'Get notified when value crosses above or below threshold.',
    typeLabel: 'Alert type',
    typeUsd: 'USD value',
    typePct: '24h change %',
    directionLabel: 'Condition',
    above: 'Above',
    below: 'Below',
    valueLabel: 'Value',
    valuePlaceholderUsd: 'e.g. 5000',
    valuePlaceholderPct: 'e.g. 10',
    currentPrice: 'Current price',
    currentValue: 'Current value',
    addAlert: 'Create alert',
    creating: 'Creating…',
    cancel: 'Cancel',
    errorRequired: 'Fill in all fields',
    errorNumber: 'Must be a valid number',
  },
}

export function AlertDialog({
  open,
  onOpenChange,
  walletKey,
  walletLabel,
  chainSymbol,
  currentPriceUsd,
  currentBalanceUsd,
  onAdd,
}: AlertDialogProps) {
  const [locale] = useState<'es' | 'en'>('es')
  const t = T[locale]
  const [type, setType] = useState<'usd' | 'pct'>('usd')
  const [direction, setDirection] = useState<'above' | 'below'>('above')
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!value.trim()) {
      setError(t.errorRequired)
      return
    }

    const numValue = Number(value)
    if (!Number.isFinite(numValue)) {
      setError(t.errorNumber)
      return
    }

    if (type === 'pct' && numValue <= 0) {
      setError(t.errorNumber)
      return
    }

    setCreating(true)
    // Small delay for UX
    setTimeout(() => {
      onAdd({
        walletKey,
        type,
        direction,
        value: numValue,
        triggered: false,
      })
      setValue('')
      setCreating(false)
      onOpenChange(false)
    }, 150)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t.title}</DialogTitle>
          <DialogDescription>{t.description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 border-t pt-4" noValidate>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">{t.typeLabel}</label>
            <Select value={type} onValueChange={(v) => v && setType(v as 'usd' | 'pct')}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="usd">{t.typeUsd}</SelectItem>
                <SelectItem value="pct">{t.typePct}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">{t.directionLabel}</label>
            <Select value={direction} onValueChange={(v) => v && setDirection(v as 'above' | 'below')}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="above">{t.above}</SelectItem>
                <SelectItem value="below">{t.below}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">{t.valueLabel}</label>
            <Input
              type="number"
              step={type === 'usd' ? '0.01' : '0.1'}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={type === 'usd' ? t.valuePlaceholderUsd : t.valuePlaceholderPct}
              className="h-9"
              disabled={creating}
              autoFocus
            />
          </div>

          {(currentPriceUsd !== null || currentBalanceUsd !== null) && (
            <div className="rounded-md bg-muted/50 p-3 text-xs space-y-1">
              {currentPriceUsd !== null && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t.currentPrice}</span>
                  <span className="font-mono tabular-nums">{chainSymbol} ${currentPriceUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              )}
              {currentBalanceUsd !== null && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t.currentValue}</span>
                  <span className="font-mono tabular-nums">${currentBalanceUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              )}
            </div>
          )}

          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={creating}>
              {t.cancel}
            </Button>
            <Button type="submit" disabled={creating}>
              {creating ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Bell aria-hidden="true" />}
              {creating ? t.creating : t.addAlert}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}