'use client'

import { useState } from 'react'
import { AlertTriangle, Bell, Check, Copy, ExternalLink, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AlertDialog } from '@/components/alert-dialog'
import type { BalanceResult, Chain, Wallet } from '@/lib/chains'
import { formatBalance, formatUsd, shortenAddress } from '@/lib/format'

export function WalletRow({
  wallet,
  chain,
  result,
  onRemove,
}: {
  wallet: Wallet
  chain: Chain
  result?: BalanceResult
  onRemove: () => void
}) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    await navigator.clipboard.writeText(wallet.address)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <li className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-3 px-4 py-4 md:grid-cols-[minmax(0,1fr)_12rem_9rem_auto] md:px-5">
      <div className="flex min-w-0 items-center gap-3">
        <span className="inline-flex h-6 shrink-0 items-center rounded-md border bg-secondary px-2 font-mono text-[11px] font-medium tracking-wide text-secondary-foreground uppercase">
          {chain.id}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{wallet.label ?? chain.name}</p>
          <div className="flex items-center gap-1">
            <code className="truncate font-mono text-xs text-muted-foreground" title={wallet.address}>
              <span className="md:hidden">{shortenAddress(wallet.address)}</span>
              <span className="hidden lg:inline">{wallet.address}</span>
              <span className="hidden md:inline lg:hidden">{shortenAddress(wallet.address, 10)}</span>
            </code>
            <button
              type="button"
              onClick={copy}
              className="rounded p-1 text-muted-foreground transition-colors hover:text-foreground"
              aria-label={copied ? 'Address copied' : 'Copy address'}
            >
              {copied ? <Check className="size-3.5 text-primary" /> : <Copy className="size-3.5" />}
            </button>
          </div>
        </div>
      </div>

      <div className="text-right md:order-none">
        {!result ? (
          <div className="ml-auto flex flex-col items-end gap-1.5" aria-label="Loading balance">
            <div className="h-4 w-28 animate-pulse rounded bg-muted" />
            <div className="h-3 w-16 animate-pulse rounded bg-muted" />
          </div>
        ) : result.ok ? (
          <>
            <p className="font-mono text-sm font-medium tabular-nums">
              {formatBalance(result.balance!)} <span className="text-muted-foreground">{chain.symbol}</span>
            </p>
            <p className="font-mono text-xs text-muted-foreground tabular-nums">
              {result.usd != null ? formatUsd(result.usd) : 'Price unavailable'}
            </p>
          </>
        ) : (
          <p className="flex items-center justify-end gap-1.5 text-xs text-destructive">
            <AlertTriangle className="size-3.5 shrink-0" aria-hidden="true" />
            {result.error ?? 'Lookup failed'}
          </p>
        )}
      </div>

      <p className="hidden text-right font-mono text-xs text-muted-foreground tabular-nums md:block">
        {result?.ok && result.txCount != null ? `${result.txCount.toLocaleString()} txns` : '—'}
      </p>

      <div className="col-span-2 flex items-center justify-end gap-1 md:col-span-1">
        {chain.explorerAddressUrl && (
          <Button
            variant="ghost"
            size="sm"
            nativeButton={false}
            render={
              <a href={chain.explorerAddressUrl(wallet.address)} target="_blank" rel="noopener noreferrer" />
            }
            className="text-muted-foreground"
          >
            {chain.explorerName}
            <ExternalLink aria-hidden="true" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onRemove}
          aria-label={`Remove ${wallet.label ?? wallet.address}`}
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 />
        </Button>
      </div>
    </li>
  )
}
