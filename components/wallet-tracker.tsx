'use client'

import { useEffect, useMemo, useState } from 'react'
import useSWR from 'swr'
import { Download, Link2, RefreshCw, Wallet as WalletIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AddWalletForm } from '@/components/add-wallet-form'
import { WalletRow } from '@/components/wallet-row'
import { formatUsd } from '@/lib/format'
import { useT } from '@/lib/i18n'
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
  { chain: 'btc', address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh', label: 'Billetera BTC de ejemplo' },
  { chain: 'sol', address: 'vines1vzrYbzLMRdu58ou5XTby4qAqVRLmqo36NKPTg', label: 'Billetera SOL de ejemplo' },
]

async function fetcher(url: string): Promise<BalancesResponse> {
  const res = await fetch(url)
  if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? 'Request failed')
  return res.json()
}

const LOCAL_STORAGE_KEYS = {
  wallets: 'ledgerline-wallets',
  networks: 'ledgerline-networks',
  alerts: 'ledgerline-alerts',
}

export function WalletTracker({
  initialWallets,
  initialNetworks,
}: {
  initialWallets: Wallet[]
  initialNetworks: CustomNetwork[]
}) {
  const t = useT()

  const [wallets, setWallets] = useState<Wallet[]>(() => {
    if (initialWallets.length > 0) return initialWallets
    if (typeof window === 'undefined') return []
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEYS.wallets)
      if (!raw) return []
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  })

  const [networks, setNetworks] = useState<CustomNetwork[]>(() => {
    if (initialNetworks.length > 0) return initialNetworks
    if (typeof window === 'undefined') return []
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEYS.networks)
      if (!raw) return []
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  })

  const [linkCopied, setLinkCopied] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [alerts, setAlerts] = useState<Alert[]>(() => {
    if (typeof window === 'undefined') return []
    try {
      return JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.alerts) || '[]')
    } catch {
      return []
    }
  })

  const chains = useMemo(() => buildChainMap(networks), [networks])
  const encoded = encodeWallets(wallets)
  const encodedNetworks = encodeNetworks(networks)

  useEffect(() => {
    const url = new URL(window.location.href)
    if (encoded) url.searchParams.set('w', encoded)
    else url.searchParams.delete('w')
    if (encodedNetworks) url.searchParams.set('n', encodedNetworks)
    else url.searchParams.delete('n')
    window.history.replaceState(null, '', url)
  }, [encoded, encodedNetworks])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_KEYS.wallets, JSON.stringify(wallets))
    }
  }, [wallets])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_KEYS.networks, JSON.stringify(networks))
    }
  }, [networks])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_KEYS.alerts, JSON.stringify(alerts))
    }
  }, [alerts])

  function removeNetwork(id: string) {
    setNetworks((prev) => prev.filter((n) => n.id !== id))
    setWallets((prev) => prev.filter((w) => w.chain !== id))
  }

  function addAlert(alert: Omit<Alert, 'id' | 'triggered'>) {
    setAlerts((prev) => [...prev, { ...alert, id: Math.random().toString(36).slice(2), triggered: false }])
  }

  function removeAlert(id: string) {
    setAlerts((prev) => prev.filter((a) => a.id !== id))
  }

  const { data, error, isValidating, mutate } = useSWR(
    encoded
      ? `/api/balances?w=${encodeURIComponent(encoded)}${encodedNetworks ? `&n=${encodeURIComponent(encodedNetworks)}` : ''}`
      : null,
    fetcher,
    { keepPreviousData: true, refreshInterval: 60_000, revalidateOnFocus: false },
  )

  const resultsByKey = useMemo(() => {
    const map = new Map<string, BalanceResult>()
    for (const r of data?.results ?? []) map.set(walletKey(r), r)
    return map
  }, [data])

  const syncedAlerts = useMemo(
    () =>
      alerts.map((alert) => {
        const current = resultsByKey.get(alert.walletKey)?.usd
        if (current == null) return { ...alert, triggered: false }
        if (alert.type === 'usd') {
          const triggered = alert.direction === 'above' ? current > alert.value : current < alert.value
          return { ...alert, triggered }
        }
        return { ...alert, triggered: false }
      }),
    [alerts, resultsByKey],
  )

  const existing = useMemo(() => new Set(wallets.map(walletKey)), [wallets])
  const totalUsd = wallets.reduce((sum, w) => sum + (resultsByKey.get(walletKey(w))?.usd ?? 0), 0)
  const loadedCount = wallets.filter((w) => resultsByKey.get(walletKey(w))?.ok).length

  async function copyLink() {
    await navigator.clipboard.writeText(window.location.href)
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 1500)
  }

  async function exportData() {
    if (!data || wallets.length === 0) return
    setIsExporting(true)
    try {
      const url = new URL(window.location.href)
      url.searchParams.set('w', encoded!)
      url.searchParams.set('n', encodedNetworks!)
      const res = await fetch(`/api/export${url.searchParams.toString() ? '?' + url.searchParams.toString() : ''}`)
      const result = await res.json()
      const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' })
      const downloadUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = downloadUrl
      a.download = 'ledgerline-snapshot.json'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(downloadUrl)
    } catch (err) {
      console.error('Export failed:', err)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <section aria-labelledby="add-heading" className="rounded-xl border bg-card p-4 md:p-5">
        <h2 id="add-heading" className="sr-only">
          {t.addWallet}
        </h2>
        {wallets.length >= MAX_WALLETS ? (
          <p className="text-sm text-muted-foreground">
            {t.maxWallets} {MAX_WALLETS} {t.maxWalletsSuffix}
          </p>
        ) : (
          <AddWalletForm
            chains={chains}
            networks={networks}
            existing={existing}
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
            {error.message}
          </p>
        )}

        {wallets.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
            <div className="flex size-10 items-center justify-center rounded-full bg-secondary">
              <WalletIcon className="size-5 text-muted-foreground" aria-hidden="true" />
            </div>
            <p className="font-medium">{t.noWallets}</p>
            <p className="mt-1 text-sm text-muted-foreground text-pretty">{t.pasteAddress}</p>
            <Button variant="outline" size="sm" onClick={() => setWallets(SAMPLE_WALLETS)}>
              {t.trySample}
            </Button>
          </div>
        ) : (
          <ul className="divide-y" aria-busy={isValidating}>
            {wallets.map((w) => (
              <WalletRow
                key={walletKey(w)}
                wallet={w}
                chain={chains[w.chain]}
                result={resultsByKey.get(walletKey(w))}
                onRemove={() => setWallets((prev) => prev.filter((p) => walletKey(p) !== walletKey(w)))}
                alerts={syncedAlerts}
                onAddAlert={addAlert}
                onRemoveAlert={removeAlert}
              />
            ))}
          </ul>
        )}
      </section>

      {data && Object.keys(data.prices).length > 0 && (
        <p className="text-center font-mono text-xs text-muted-foreground">
          {t.pricePrefix}{' '}
          {Object.entries(data.prices)
            .map(([id, price]) => {
              const symbol = Object.values(chains).find((c) => c.coingeckoId === id)?.symbol ?? id
              return `${symbol} ${formatUsd(price)}`
            })
            .join('  ·  ')}
        </p>
      )}
    </div>
  )
}

function Stat({ label, value, hint, highlight }: { label: string; value: string; hint?: string; highlight?: boolean }) {
  return (
    <div className="bg-card px-5 py-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 font-mono text-2xl font-semibold tabular-nums ${highlight ? 'text-primary' : ''}`}>{value}</p>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}