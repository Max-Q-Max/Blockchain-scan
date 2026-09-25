'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CHAINS, CHAIN_BY_ID, detectChain, isValidAddress, type Wallet } from '@/lib/chains'

const chainItems = CHAINS.map((c) => ({ value: c.id, label: c.name }))

export function AddWalletForm({ onAdd, existing }: { onAdd: (w: Wallet) => void; existing: Set<string> }) {
  const [address, setAddress] = useState('')
  const [chainId, setChainId] = useState('eth')
  const [label, setLabel] = useState('')
  const [error, setError] = useState<string | null>(null)

  function handleAddressChange(value: string) {
    setAddress(value)
    setError(null)
    const detected = detectChain(value)
    if (detected && CHAIN_BY_ID[detected].kind !== CHAIN_BY_ID[chainId].kind) setChainId(detected)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = address.trim()
    const chain = CHAIN_BY_ID[chainId]
    if (!isValidAddress(chain, trimmed)) {
      setError(`That doesn't look like a valid ${chain.name} address.`)
      return
    }
    if (existing.has(`${chainId}:${trimmed}`)) {
      setError('This wallet is already on your list.')
      return
    }
    onAdd({ chain: chainId, address: trimmed, label: label.trim() || undefined })
    setAddress('')
    setLabel('')
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3" noValidate>
      <div className="flex flex-col gap-3 md:flex-row">
        <div className="flex flex-1 flex-col gap-1.5">
          <label htmlFor="address" className="text-xs font-medium text-muted-foreground">
            Wallet address
          </label>
          <Input
            id="address"
            value={address}
            onChange={(e) => handleAddressChange(e.target.value)}
            placeholder="0x…, bc1…, or a Solana address"
            autoComplete="off"
            spellCheck={false}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? 'address-error' : undefined}
            className="h-10 font-mono text-sm"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="chain" className="text-xs font-medium text-muted-foreground">
            Network
          </label>
          <Select items={chainItems} value={chainId} onValueChange={(v) => v && setChainId(v)}>
            <SelectTrigger id="chain" className="h-10! w-full md:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {chainItems.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="label" className="text-xs font-medium text-muted-foreground">
            Label <span className="font-normal">(optional)</span>
          </label>
          <Input
            id="label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Cold storage"
            maxLength={40}
            className="h-10 md:w-44"
          />
        </div>
        <div className="flex flex-col justify-end">
          <Button type="submit" className="h-10 px-4">
            <Plus aria-hidden="true" />
            Add wallet
          </Button>
        </div>
      </div>
      {error && (
        <p id="address-error" role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </form>
  )
}
