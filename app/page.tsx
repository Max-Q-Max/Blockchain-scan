import { WalletTracker } from '@/components/wallet-tracker'
import { buildChainMap, decodeNetworks, decodeWallets } from '@/lib/chains'

type SearchParams = Promise<{ w?: string | string[]; n?: string | string[] }>

export default async function Page({ searchParams }: { searchParams: SearchParams }) {
  const { w, n } = await searchParams
  const initialNetworks = decodeNetworks(Array.isArray(n) ? n[0] : n)
  const initialWallets = decodeWallets(Array.isArray(w) ? w[0] : w, buildChainMap(initialNetworks))

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col gap-8 px-4 py-10 md:py-16">
      <WalletTracker initialWallets={initialWallets} initialNetworks={initialNetworks} />
    </main>
  )
}
