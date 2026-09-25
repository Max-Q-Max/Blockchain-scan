import { WalletTracker } from '@/components/wallet-tracker'
import { CHAINS, buildChainMap, decodeNetworks, decodeWallets } from '@/lib/chains'

type SearchParams = Promise<{ w?: string | string[]; n?: string | string[] }>

export default async function Page({ searchParams }: { searchParams: SearchParams }) {
  const { w, n } = await searchParams
  const initialNetworks = decodeNetworks(Array.isArray(n) ? n[0] : n)
  const initialWallets = decodeWallets(Array.isArray(w) ? w[0] : w, buildChainMap(initialNetworks))

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col gap-8 px-4 py-10 md:py-16">
      <header className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-primary" aria-hidden="true" />
          <span className="font-mono text-xs tracking-widest text-muted-foreground uppercase">Ledgerline</span>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-balance md:text-4xl">Wallet balance checker</h1>
        <p className="max-w-2xl text-muted-foreground text-pretty">
          Live on-chain balances pulled directly from public explorers and RPC nodes. Supports{' '}
          {CHAINS.map((c) => c.name).join(', ')} — plus any EVM network you add.
        </p>
      </header>

      <WalletTracker initialWallets={initialWallets} initialNetworks={initialNetworks} />

      <footer className="mt-auto text-center text-xs text-muted-foreground">
        Data from mempool.space, public RPC nodes, and CoinGecko. Your wallet list lives in the URL — nothing is stored.
      </footer>
    </main>
  )
}
