import { NextResponse } from 'next/server'
import { buildChainMap, decodeNetworks, decodeWallets } from '@/lib/chains'
import { getBalances } from '@/lib/balances'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const chains = buildChainMap(decodeNetworks(searchParams.get('n')))
  const wallets = decodeWallets(searchParams.get('w'), chains)
  if (wallets.length === 0) {
    return NextResponse.json({ error: 'Provide at least one valid wallet via ?w=chain:address' }, { status: 400 })
  }
  const data = await getBalances(wallets, chains)
  return NextResponse.json({ ...data, fetchedAt: new Date().toISOString() })
}
