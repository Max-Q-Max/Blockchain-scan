'use client'

import { useEffect, useMemo, useState } from 'react'
import useSWR from 'swr'
import { Download, Link2, RefreshCw, Wallet as WalletIcon, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AddWalletForm } from '@/components/add-wallet-form'
import { WalletRow } from '@/components/wallet-row'
import { formatUsd } from '@/lib/format'
import {
  buildChainMap,
  encodeNetworks,
  encodeWallets,
  walletKey,
  type BalanceResult,
  type CustomNetwork,
  type Wallet,
} from '@/lib/chains'

type BalancesResponse = { results: BalanceResult[]; prices: Record<string, number>; fetchedAt: string }
type Alert = { id: string; walletKey: string; type: 'usd' | 'pct'; direction: 'above' | 'below'; value: number; triggered: boolean }

const MAX_WALLETS = 25

const SAMPLE_WALLETS: Wallet[] = [
  { chain: 'eth', address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', label: 'vitalik.eth' },
  { chain: 'btc', address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh', label: 'BTC Wallet Example' },
  { chain: 'sol', address: 'vines1vzrYbzLMRdu58ou5XTby4qAqVRLmqo36NKPTg', label: 'SOL Wallet Example' },
]

async function fetcher(url: string): Promise<BalancesResponse> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

const T = {
  es: {
    addWallet: 'Agregar billetera',
    trackedWallets: 'Billeteras rastreadas',
    portfolioSummary: 'Resumen de cartera',
    totalValue: 'Valor total',
    walletsResolved: 'Billeteras resueltas',
    lastUpdated: 'Última actualización',
    autoRefresh: 'Se actualiza automáticamente cada 30s',
    shareLink: 'Compartir enlace',
    copied: '¡Copiado!',
    refresh: 'Actualizar',
    export: 'Exportar',
    exporting: 'Exportando…',
    noWallets: 'Sin billeteras agregadas',
    pasteAddress: 'Pega una dirección de billetera arriba para comenzar',
    invalidAddress: (network: string) => `Esa no parece ser una dirección válida de ${network}.`,
    balance: 'Saldo',
    chain: 'Red',
    actions: 'Acciones',
    remove: 'Eliminar',
    removeWallet: 'Eliminar billetera',
    removeWalletDesc: '¿Está seguro de que desea eliminar esta billetera?',
    confirm: 'Confirmar',
    cancel: 'Cancelar',
    switchLanguage: 'Cambiar idioma',
    english: 'English',
    spanish: 'Español',
    error: 'Error',
    maxWallets: 'Límite de',
    maxWalletsDesc: 'billeteras. Elimina una para agregar otra.',
  },
  en: {
    addWallet: 'Add wallet',
    trackedWallets: 'Tracked wallets',
    portfolioSummary: 'Portfolio summary',
    totalValue: 'Total value',
    walletsResolved: 'Wallets resolved',
    lastUpdated: 'Last updated',
    autoRefresh: 'Auto-refreshes every 30s',
    shareLink: 'Share link',
    copied: 'Copied!',
    refresh: 'Refresh',
    export: 'Export',
    exporting: 'Exporting…',
    noWallets: 'No wallets added',
    pasteAddress: 'Paste a wallet address above to get started',
    invalidAddress: (network: string) => `That doesn't look like a valid ${network} address.`,
    balance: 'Balance',
    chain: 'Chain',
    actions: 'Actions',
    remove: 'Remove',
    removeWallet: 'Remove wallet',
    removeWalletDesc: 'Are you sure you want to remove this wallet?',
    confirm: 'Confirm',
    cancel: 'Cancel',
    switchLanguage: 'Switch language',
    english: 'English',
    spanish: 'Español',
    error: 'Error',
    maxWallets: 'Limit of',
    maxWalletsDesc: 'wallets. Remove one to add another.',
  },
}

export function WalletTracker({
  initialWallets,
  initialNetworks,
}: {
  initialWallets: Wallet[]
  initialNetworks: CustomNetwork[]
}) {
  const [wallets, setWallets] = useState<Wallet[]>(() => {
    if (initialWallets.length > 0) return initialWallets
    if (typeof window === 'undefined') return []
    try {
      const stored = localStorage.getItem('ledgerline-wallets')
      return stored ? JSON.parse(stored) : SAMPLE_WALLETS
    } catch {
      return SAMPLE_WALLETS
    }
  })
  const [networks, setNetworks] = useState<CustomNetwork[]>(initialNetworks)
  const [locale, setLocale] = useState<'es' | 'en'>('es')
  const [alerts, setAlerts] = useState<Alert[]>(() => {
    if (typeof window === 'undefined') return []
    try {
      const stored = localStorage.getItem('ledgerline-alerts')
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })
  const [linkCopied, setLinkCopied] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  const t = T[locale]
  const chainMap = useMemo(() => buildChainMap(networks), [networks])
  const queryString = useMemo(() => {
    const w = encodeWallets(wallets)
    const n = encodeNetworks(networks)
    return w && n ? `?w=${w}&n=${n}` : ''
  }, [wallets, networks])

  useEffect(() => {
    localStorage.setItem('ledgerline-wallets', JSON.stringify(wallets))
  }, [wallets])

  useEffect(() => {
    localStorage.setItem('ledgerline-alerts', JSON.stringify(alerts))
  }, [alerts])

  const { data, error, isValidating, mutate } = useSWR<BalancesResponse>(
    wallets.length > 0 ? `/api/balances?${new URLSearchParams({ w: encodeWallets(wallets), n: encodeNetworks(networks) }).toString()}` : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 5000, focusThrottleInterval: 30000 }
  )

  const loadedCount = useMemo(() => data?.results.filter((r) => r.balance !== '0').length ?? 0, [data])
  const totalUsd = useMemo(
    () =>
      data
        ? data.results.reduce((sum, r) => {
            const chain = chainMap.get(r.chain)
            if (!chain) return sum
            const balance = parseFloat(r.balance) || 0
            const price = data.prices[chain.coingeckoId!] ?? 0
            return sum + balance * price
          }, 0)
        : 0,
    [data, chainMap]
  )

  function copyLink() {
    navigator.clipboard.writeText(`${typeof window !== 'undefined' ? window.location.origin : ''}${queryString || '/'}`)
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
  }

  function exportData() {
    if (!data) return
    setIsExporting(true)
    const csv = [
      ['Chain', 'Address', 'Balance', 'USD Value'].join(',''),
      ...data.results.map((r) => {
        const chain = chainMap.get(r.chain)
        const balance = parseFloat(r.balance) || 0
        const price = data.prices[chain?.coingeckoId!] ?? 0
        const usdValue = balance * price
        return [r.chain, r.address, balance.toString(), usdValue.toString()].join(',')
      }),
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `blockchain-scan-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    setIsExporting(false)
  }

  function removeNetwork(id: string) {
    setNetworks((prev) => prev.filter((n) => n.id !== id))
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t.trackedWallets}</h1>
          <p className="text-sm text-muted-foreground">{t.portfolioSummary}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setLocale((prev) => (prev === 'es' ? 'en' : 'es'))}
          aria-label={t.switchLanguage}
          title={locale === 'es' ? t.english : t.spanish}
          className="flex items-center gap-2"
        >
          <Globe className="size-4" />
          <span className="text-xs font-medium">{locale.toUpperCase()}</span>
        </Button>
      </header>

      <section aria-labelledby="add-heading" className="rounded-xl border bg-card p-4 md:p-5">
        <h2 id="add-heading" className="sr-only">
          {t.addWallet}
        </h2>
        {wallets.length >= MAX_WALLETS ? (
          <p className="text-sm text-muted-foreground">
            {t.maxWallets} {MAX_WALLETS} {t.maxWalletsDesc}
          </p>
        ) : (
          <AddWalletForm
            chains={Array.from(chainMap.values())}
            networks={networks}
            existing={wallets}
            onAdd={(w) => setWallets((prev) => [...prev, w])}
            onAddNetwork={(n) => setNetworks((prev) => [...prev, n])}
            onRemoveNetwork={removeNetwork}
          />
        )}
      </section>

      <section aria-labelledby="summary-heading" className="grid gap-px overflow-hidden rounded-xl border bg-border sm:grid-cols-3">
        <h2 id="summary-heading" className="sr-only">
          {t.portfolioSummary}
        </h2>
        <Stat label={t.totalValue} value={wallets.length ? formatUsd(totalUsd) : '—'} highlight />
        <Stat label={t.walletsResolved} value={`${loadedCount} / ${wallets.length}`} />
        <Stat label={t.lastUpdated} value={data ? new Date(data.fetchedAt).toLocaleTimeString() : '—'} hint={t.autoRefresh} />
      </section>

      <section aria-labelledby="wallets-heading" className="overflow-hidden rounded-xl border bg-card">
        <div className="flex items-center justify-between gap-3 border-b px-4 py-3 md:px-5">
          <h2 id="wallets-heading" className="text-sm font-medium">
            {t.trackedWallets}
          </h2>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={copyLink} disabled={!wallets.length}>
              <Link2 aria-hidden="true" />
              {linkCopied ? t.copied : t.shareLink}
            </Button>
            <Button variant="outline" size="sm" onClick={() => mutate()} disabled={!wallets.length || isValidating}>
              <RefreshCw aria-hidden="true" className={isValidating ? 'animate-spin' : undefined} />
              {t.refresh}
            </Button>
            <Button variant="secondary" size="sm" onClick={() => exportData()} disabled={!data || wallets.length === 0}>
              <Download aria-hidden="true" className={isExporting ? 'animate-spin' : undefined} />
              {isExporting ? t.exporting : t.export}
            </Button>
          </div>
        </div>

        {error && (
          <p role="alert" className="border-b bg-destructive/10 px-5 py-2 text-sm text-destructive">
            {t.error}: {error.message}
          </p>
        )}

        {wallets.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
            <div className="flex size-10 items-center justify-center rounded-full bg-secondary">
              <WalletIcon className="size-5 text-muted-foreground" aria-hidden="true" />
            </div>
            <p className="font-medium">{t.noWallets}</p>
            <p className="mt-1 text-sm text-muted-foreground text-pretty">{t.pasteAddress}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-xs font-medium text-muted-foreground">
                  <th className="px-4 py-2 text-left md:px-5">{t.chain}</th>
                  <th className="px-4 py-2 text-left md:px-5">Address</th>
                  <th className="px-4 py-2 text-right md:px-5">{t.balance}</th>
                  <th className="px-4 py-2 text-right md:px-5">USD</th>
                  <th className="px-4 py-2 text-right md:px-5">{t.actions}</th>
                </tr>
              </thead>
              <tbody>
                {wallets.map((w) => (
                  <WalletRow
                    key={walletKey(w)}
                    wallet={w}
                    chain={chainMap.get(w.chain)}
                    balance={data?.results.find((r) => r.chain === w.chain && r.address === w.address)?.balance}
                    price={data?.prices[chainMap.get(w.chain)?.coingeckoId!] ?? null}
                    alerts={alerts.filter((a) => a.walletKey === walletKey(w))}
                    onAddAlert={(alert) => setAlerts((prev) => [...prev, { ...alert, id: Math.random().toString(36) }])}
                    onRemoveAlert={(id) => setAlerts((prev) => prev.filter((a) => a.id !== id))}
                    onRemoveWallet={() => setWallets((prev) => prev.filter((x) => walletKey(x) !== walletKey(w)))}
                    locale={locale}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

function Stat({ label, value, highlight, hint }: { label: string; value: string; highlight?: boolean; hint?: string }) {
  return (
    <div className={`flex flex-col gap-2 px-4 py-3 md:px-5 ${highlight ? 'bg-primary/5' : 'bg-muted/50'}`}>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span className={`text-lg font-bold ${highlight ? 'text-primary' : ''}`}>{value}</span>
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </div>
  )
}
