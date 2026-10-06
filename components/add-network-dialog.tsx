'use client'

import { useState } from 'react'
import { Loader2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useT } from '@/lib/i18n'
import { PRESET_NETWORKS, sanitizeNetwork, slugifyNetworkId, type CustomNetwork } from '@/lib/chains'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  takenIds: Set<string>
  onAdd: (network: CustomNetwork) => void
}

const EMPTY = { name: '', symbol: '', rpcUrl: '', explorerUrl: '', coingeckoId: '' }

export function AddNetworkDialog({ open, onOpenChange, takenIds, onAdd }: Props) {
  const t = useT()
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState<string | null>(null)
  const [verifying, setVerifying] = useState(false)

  const presets = PRESET_NETWORKS.filter((p) => !takenIds.has(p.id))

  function update(field: keyof typeof EMPTY, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
    setError(null)
  }

  function finish(network: CustomNetwork) {
    onAdd(network)
    setForm(EMPTY)
    setError(null)
    onOpenChange(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const network = sanitizeNetwork({ ...form, id: slugifyNetworkId(form.name, takenIds) })
    if (!network) {
      setError(t.networkError)
      return
    }
    setVerifying(true)
    try {
      const res = await fetch('/api/networks/verify', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ rpcUrl: network.rpcUrl }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? t.verificationFailed)
      finish(network)
    } catch (err) {
      setError(err instanceof Error ? err.message : t.verificationFailed)
    } finally {
      setVerifying(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t.addNetworkTitle}</DialogTitle>
          <DialogDescription>{t.addNetworkDesc}</DialogDescription>
        </DialogHeader>

        {presets.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium text-muted-foreground">{t.popularNetworks}</p>
            <div className="flex flex-wrap gap-2">
              {presets.map((p) => (
                <Button key={p.id} type="button" variant="outline" size="sm" onClick={() => finish(p)}>
                  <Plus aria-hidden="true" />
                  {p.name}
                </Button>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 border-t pt-4" noValidate>
          <p className="text-xs font-medium text-muted-foreground">{t.customEvmNetwork}</p>
          <div className="grid grid-cols-[1fr_7rem] gap-3">
            <Field
              id="net-name"
              label={t.networkName}
              value={form.name}
              onChange={(v) => update('name', v)}
              placeholder={t.networkNamePlaceholder}
              maxLength={32}
            />
            <Field
              id="net-symbol"
              label={t.symbol}
              value={form.symbol}
              onChange={(v) => update('symbol', v)}
              placeholder="MNT"
              maxLength={10}
            />
          </div>
          <Field
            id="net-rpc"
            label={t.rpcUrl}
            value={form.rpcUrl}
            onChange={(v) => update('rpcUrl', v)}
            placeholder="https://rpc.example.org"
            mono
          />
          <Field
            id="net-explorer"
            label={t.blockExplorerUrl}
            optional
            value={form.explorerUrl}
            onChange={(v) => update('explorerUrl', v)}
            placeholder="https://explorer.example.org"
            mono
          />
          <Field
            id="net-cg"
            label={t.coingeckoId}
            optional
            value={form.coingeckoId}
            onChange={(v) => update('coingeckoId', v)}
            placeholder={t.coingeckoPlaceholder}
            mono
          />

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              {t.cancel}
            </Button>
            <Button type="submit" disabled={verifying}>
              {verifying ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Plus aria-hidden="true" />}
              {verifying ? t.verifyingRpc : t.addNetworkBtn}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function Field({
  id,
  label,
  value,
  onChange,
  placeholder,
  optional,
  mono,
  maxLength = 200,
}: {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  optional?: boolean
  mono?: boolean
  maxLength?: number
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-medium text-muted-foreground">
        {label} {optional && <span className="font-normal">(optional)</span>}
      </label>
      <Input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        autoComplete="off"
        spellCheck={false}
        className={mono ? 'h-9 font-mono text-sm' : 'h-9'}
      />
    </div>
  )
}