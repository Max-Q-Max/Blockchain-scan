import 'server-only'
import { CHAIN_BY_ID, type BalanceResult, type Chain, type Wallet } from '@/lib/chains'

const TIMEOUT_MS = 10_000

async function fetchJson(url: string, init?: RequestInit) {
  const res = await fetch(url, {
    ...init,
    headers: { 'content-type': 'application/json', accept: 'application/json', ...init?.headers },
    signal: AbortSignal.timeout(TIMEOUT_MS),
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`Explorer responded with ${res.status}`)
  return res.json()
}

async function rpc(url: string, method: string, params: unknown[]) {
  const data = await fetchJson(url, {
    method: 'POST',
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  })
  if (data.error) throw new Error(data.error.message ?? 'RPC error')
  return data.result
}

export function formatUnits(raw: bigint, decimals: number): string {
  const negative = raw < BigInt(0)
  const value = negative ? -raw : raw
  const base = BigInt(`1${'0'.repeat(decimals)}`)
  const whole = value / base
  const fraction = (value % base).toString().padStart(decimals, '0').replace(/0+$/, '')
  return `${negative ? '-' : ''}${whole}${fraction ? `.${fraction}` : ''}`
}

async function getRawBalance(chain: Chain, address: string): Promise<{ raw: bigint; txCount: number | null }> {
  switch (chain.kind) {
    case 'evm': {
      const [balance, nonce] = await Promise.all([
        rpc(chain.rpcUrl!, 'eth_getBalance', [address, 'latest']),
        rpc(chain.rpcUrl!, 'eth_getTransactionCount', [address, 'latest']).catch(() => null),
      ])
      return { raw: BigInt(balance), txCount: nonce ? Number(BigInt(nonce)) : null }
    }
    case 'bitcoin': {
      const data = await fetchJson(`https://mempool.space/api/address/${encodeURIComponent(address)}`)
      const c = data.chain_stats
      const m = data.mempool_stats
      const raw =
        BigInt(c.funded_txo_sum) - BigInt(c.spent_txo_sum) + BigInt(m.funded_txo_sum) - BigInt(m.spent_txo_sum)
      return { raw, txCount: c.tx_count + m.tx_count }
    }
    case 'solana': {
      const result = await rpc(chain.rpcUrl!, 'getBalance', [address])
      return { raw: BigInt(result.value), txCount: null }
    }
  }
}

export async function getPrices(ids: string[]): Promise<Record<string, number>> {
  if (ids.length === 0) return {}
  try {
    const data = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids.join(',')}&vs_currencies=usd`,
      { signal: AbortSignal.timeout(TIMEOUT_MS), next: { revalidate: 60 } },
    ).then((r) => (r.ok ? r.json() : {}))
    return Object.fromEntries(
      Object.entries(data as Record<string, { usd?: number }>)
        .filter(([, v]) => typeof v?.usd === 'number')
        .map(([k, v]) => [k, v.usd as number]),
    )
  } catch {
    return {}
  }
}

export async function getBalances(wallets: Wallet[]): Promise<{ results: BalanceResult[]; prices: Record<string, number> }> {
  const priceIds = [...new Set(wallets.map((w) => CHAIN_BY_ID[w.chain].coingeckoId))]
  const [prices, results] = await Promise.all([
    getPrices(priceIds),
    Promise.all(
      wallets.map(async (w): Promise<BalanceResult> => {
        const chain = CHAIN_BY_ID[w.chain]
        try {
          const { raw, txCount } = await getRawBalance(chain, w.address)
          return { chain: w.chain, address: w.address, ok: true, raw: raw.toString(), balance: formatUnits(raw, chain.decimals), txCount }
        } catch (err) {
          return {
            chain: w.chain,
            address: w.address,
            ok: false,
            error: err instanceof Error && err.name !== 'TimeoutError' ? err.message : 'Explorer request timed out',
          }
        }
      }),
    ),
  ])

  for (const r of results) {
    const price = prices[CHAIN_BY_ID[r.chain].coingeckoId]
    r.usd = r.ok && price !== undefined ? Number(r.balance) * price : null
  }

  return { results, prices }
}
