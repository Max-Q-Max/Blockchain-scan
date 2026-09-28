import { NextResponse } from 'next/server'
import { buildChainMap, decodeNetworks, decodeWallets, type Wallet } from '@/lib/chains'
import { getBalances } from '@/lib/balances'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const walletsParam = searchParams.get('w')
  const networksParam = searchParams.get('n')

  if (!walletsParam) {
    return NextResponse.json({ error: 'Provide wallets via ?w=chain:address' }, { status: 400 })
  }

  const chains = buildChainMap(decodeNetworks(networksParam ?? ''))
  const wallets = decodeWallets(walletsParam, chains)

  if (wallets.length === 0) {
    return NextResponse.json({ error: 'Provide at least one valid wallet' }, { status: 400 })
  }

  const { results, prices } = await getBalances(wallets, chains)

  return NextResponse.json({
    results,
    prices,
    fetchedAt: new Date().toISOString(),
    walletCount: wallets.length,
  })
}