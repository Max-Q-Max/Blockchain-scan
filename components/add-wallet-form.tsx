'use client'

import { useEffect, useState } from 'react'
import { Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { Chain, CustomNetwork, Wallet } from '@/lib/chains'

const T = {
  es: {
    addWallet: 'Agregar billetera',
    enterAddress: 'Ingresa la dirección de la billetera',
    selectChain: 'Selecciona una red',
    walletLabel: 'Etiqueta (opcional)',
    addCustomNetwork: 'Agregar red personalizada',
    networkName: 'Nombre de la red',
    rpcUrl: 'URL RPC',
    add: 'Agregar',
    cancel: 'Cancelar',
    invalidAddress: (network: string) => `Esa no parece ser una dirección válida de ${network}.`,
  },
  en: {
    addWallet: 'Add wallet',
    enterAddress: 'Enter wallet address',
    selectChain: 'Select a chain',
    walletLabel: 'Label (optional)',
    addCustomNetwork: 'Add custom network',
    networkName: 'Network name',
    rpcUrl: 'RPC URL',
    add: 'Add',
    cancel: 'Cancel',
    invalidAddress: (network: string) => `That doesn't look like a valid ${network} address.`,
  },
}

export function AddWalletForm({
  chains,
  networks,
  existing,
  onAdd,
  onAddNetwork,
  onRemoveNetwork,
}: {
  chains: Chain[]
  networks: CustomNetwork[]
  existing: Wallet[]
  onAdd: (wallet: Wallet) => void
  onAddNetwork: (network: CustomNetwork) => void
  onRemoveNetwork: (id: string) => void
}) {
  const [locale, setLocale] = useState<'es' | 'en'>('es')
  const [address, setAddress] = useState('')
  const [chain, setChain] = useState(chains[0]?.id || '')
  const [label, setLabel] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [networkName, setNetworkName] = useState('')
  const [rpcUrl, setRpcUrl] = useState('')

  const t = T[locale]
  const selectedChain = chains.find((c) => c.id === chain)

  function handleAdd() {
    if (!address.trim() || !chain) return
    if (selectedChain?.validate && !selectedChain.validate(address.trim())) {
      alert(t.invalidAddress(selectedChain.name))
      return
    }
    onAdd({ chain, address: address.trim(), label: label.trim() || address.slice(0, 6) })
    setAddress('')
    setLabel('')
  }

  function handleAddNetwork() {
    if (!networkName.trim() || !rpcUrl.trim()) return
    onAddNetwork({ id: `custom-${Date.now()}`, name: networkName.trim(), rpcUrl: rpcUrl.trim() })
    setNetworkName('')
    setRpcUrl('')
    setDialogOpen(false)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <Select value={chain} onValueChange={setChain}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder={t.selectChain} />
          </SelectTrigger>
          <SelectContent>
            {chains.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Input
        type="text"
        placeholder={t.enterAddress}
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
      />

      <Input type="text" placeholder={t.walletLabel} value={label} onChange={(e) => setLabel(e.target.value)} />

      <div className="flex gap-2">
        <Button onClick={handleAdd} disabled={!address.trim() || !chain} className="flex-1">
          <Plus className="size-4" />
          {t.add}
        </Button>
        <Button onClick={() => setDialogOpen(true)} variant="outline">
          {t.addCustomNetwork}
        </Button>
      </div>

      {networks.filter((n) => n.id.startsWith('custom-')).length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-muted-foreground">Custom Networks:</p>
          {networks
            .filter((n) => n.id.startsWith('custom-'))
            .map((n) => (
              <div key={n.id} className="flex items-center justify-between gap-2 rounded border p-2">
                <span className="text-xs">{n.name}</span>
                <Button size="icon-xs" variant="ghost" onClick={() => onRemoveNetwork(n.id)}>
                  <X className="size-3" />
                </Button>
              </div>
            ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t.addCustomNetwork}</DialogTitle>
            <DialogDescription>Add a custom blockchain network</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <Input placeholder={t.networkName} value={networkName} onChange={(e) => setNetworkName(e.target.value)} />
            <Input placeholder={t.rpcUrl} value={rpcUrl} onChange={(e) => setRpcUrl(e.target.value)} />
            <div className="flex gap-2">
              <Button onClick={handleAddNetwork} className="flex-1">
                {t.add}
              </Button>
              <Button onClick={() => setDialogOpen(false)} variant="outline" className="flex-1">
                {t.cancel}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
