'use client'

import { useState } from 'react'
import { Network, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AddNetworkDialog } from '@/components/add-network-dialog'
import { MAX_CUSTOM_NETWORKS, detectChain, isValidAddress, type ChainMap, type CustomNetwork, type Wallet } from '@/lib/chains'

type Props = {
  chains: ChainMap
  networks: CustomNetwork[]
  existing: Set<string>
  onAdd: (w: Wallet) => void
  onAddNetwork: (n: CustomNetwork) => void
  onRemoveNetwork: (id: string) => void
}

export function AddWalletForm({ chains, networks, existing, onAdd, onAddNetwork, onRemoveNetwork }: Props) {
  const [address, setAddress] = useState('')
  const [chainId, setChainId] = useState('eth')
  const [label, setLabel] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const selectedChainId = chains[chainId] ? chainId : 'eth'
  const chainItems = Object.values(chains).map((c) => ({ value: c.id, label: c.name }))
  const takenIds = new Set(networks.map((n) => n.id))

  function handleAddressChange(value: string) {
    setAddress(value)
    setError(null)
    const detected = detectChain(value)
    if (detected && chains[detected].kind !== chains[selectedChainId].kind) setChainId(detected)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = address.trim()
    const chain = chains[selectedChainId]
    if (!isValidAddress(chain, trimmed)) {
      setError(`That doesn't look like a valid ${chain.name} address.`)
      return
    }
    if (existing.has(`${selectedChainId}:${trimmed}`)) {
      setError('This wallet is already on your list.')
      return
    }
    onAdd({ chain: selectedChainId, address: trimmed, label: label.trim() || undefined })
    setAddress('')
    setLabel('')
  }

  function handleAddNetwork(network: CustomNetwork) {
    onAddNetwork(network)
    setChainId(network.id)
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
            placeholder="0x…, bc1…, y… (Yerbas), or a Solana address"
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
          <div className="flex gap-1.5">
            <Select items={chainItems} value={selectedChainId} onValueChange={(v) => v && setChainId(v)}>
              <SelectTrigger id="chain" className="h-10! w-full md:w-44">
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
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-10 shrink-0"
              onClick={() => setDialogOpen(true)}
              disabled={networks.length >= MAX_CUSTOM_NETWORKS}
              aria-label="Add a network"
              title="Add a network"
            >
              <Network aria-hidden="true" />
            </Button>
          </div>
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

      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        {networks.length === 0 ? (
          <button
            type="button"
            onClick={() => setDialogOpen(true)}
            className="underline-offset-4 transition-colors hover:text-foreground hover:underline"
          >
            + Add another blockchain network (Optimism, Avalanche, or any EVM RPC)
          </button>
        ) : (
          <>
            <span>Custom networks:</span>
            {networks.map((n) => (
              <span
                key={n.id}
                className="inline-flex items-center gap-1 rounded-md border bg-secondary py-0.5 pr-0.5 pl-2 text-secondary-foreground"
              >
                {n.name}
                <button
                  type="button"
                  onClick={() => onRemoveNetwork(n.id)}
                  className="rounded p-0.5 text-muted-foreground transition-colors hover:text-destructive"
                  aria-label={`Remove ${n.name} network and its wallets`}
                >
                  <X className="size-3" />
                </button>
              </span>
            ))}
            {networks.length < MAX_CUSTOM_NETWORKS && (
              <button
                type="button"
                onClick={() => setDialogOpen(true)}
                className="underline-offset-4 transition-colors hover:text-foreground hover:underline"
              >
                + Add network
              </button>
            )}
          </>
        )}
      </div>

      <AddNetworkDialog open={dialogOpen} onOpenChange={setDialogOpen} takenIds={takenIds} onAdd={handleAddNetwork} />
    </form>
  )
}
