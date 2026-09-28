import 'server-only'
import { CHAIN_BY_ID, type BalanceResult, type Chain, type ChainMap, type Wallet } from '@/lib/chains'

const TIMEOUT_MS = 10_000

async function fetchJson(url: string, init?: RequestInit) {
  const res = await fetch(url, {
    ...init,
    headers: { 'content-type': 'application/json', accept: 'application/json', ...init?.headers },
    signal: AbortSignal.timeout(TIMEOUT_MS),
    cache: 'no-store',
    redirect: 'error',
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
    case 'iquidus': {
      // Raptoreum uses /api/getaddressbalance, Yerbas uses /ext/getbalance
      if (chain.id === 'rtm') {
        const data = await fetchJson(`${chain.explorerApiUrl}/api/getaddressbalance/${encodeURIComponent(address)}`)
        if (!data.success) throw new Error(data.error ?? 'Address not found')
        return { raw: parseUnits(data.balanceRTM.toString(), chain.decimals), txCount: null }
      } else {
        const res = await fetch(`${chain.explorerApiUrl}/ext/getbalance/${encodeURIComponent(address)}`, {
          signal: AbortSignal.timeout(TIMEOUT_MS),
          cache: 'no-store',
          redirect: 'error',
        })
        if (!res.ok) throw new Error(`Explorer responded with ${res.status}`)
        const text = (await res.text()).trim()
        if (text.startsWith('{')) {
          const err = JSON.parse(text)
          if (err.error === 'address not found.') return { raw: BigInt(0), txCount: 0 }
          throw new Error(err.error ?? 'Explorer error')
        }
        return { raw: parseUnits(text, chain.decimals), txCount: null }
      }
    }
  }
}

function parseUnits(value: string, decimals: number): bigint {
  const match = /^(-?)(\d+)(?:\.(\d+))?$/.exec(value)
  if (!match) throw new Error('Unexpected balance format from explorer')
  const [, sign, whole, fraction = ''] = match
  const raw = BigInt(whole + fraction.padEnd(decimals, '0').slice(0, decimals))
  return sign ? -raw : raw
}

async function getExplorerPrice(chain: Chain): Promise<number | null> {
  try {
    const res = await fetch(`${chain.explorerApiUrl}/ext/getcurrentprice`, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      next: { revalidate: 60 },
    })
    if (!res.ok) return null
    const data = await res.json()
    const price = Number(data.last_price_usd ?? data.last_price_usdt)
    return Number.isFinite(price) && price > 0 ? price : null
  } catch {
    return null
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

export async function verifyEvmRpc(rpcUrl: string): Promise<{ chainId: number; blockNumber: number }> {
  const [chainId, blockNumber] = await Promise.all([
    rpc(rpcUrl, 'eth_chainId', []),
    rpc(rpcUrl, 'eth_blockNumber', []),
  ])
  if (typeof chainId !== 'string' || typeof blockNumber !== 'string') throw new Error('Not an EVM JSON-RPC endpoint')
  return { chainId: Number(BigInt(chainId)), blockNumber: Number(BigInt(blockNumber)) }
}

export async function getBalances(
  wallets: Wallet[],
  chains: ChainMap = CHAIN_BY_ID,
): Promise<{ results: BalanceResult[]; prices: Record<string, number> }> {
  const walletChains = [...new Set(wallets.map((w) => chains[w.chain]))]
  const explorerPriced = walletChains.filter((c) => c.kind === 'iquidus' && c.coingeckoId)
  const priceIds = [
    ...new Set(
      walletChains
        .filter((c) => c.kind !== 'iquidus')
        .map((c) => c.coingeckoId)
        .filter((id): id is string => !!id),
    ),
  ]
  const loadPrices = async () => {
    const [geckoPrices, explorerPrices] = await Promise.all([
      getPrices(priceIds),
      Promise.all(explorerPriced.map(async (c) => [c.coingeckoId!, await getExplorerPrice(c)] as const)),
    ])
    for (const [key, price] of explorerPrices) if (price !== null) geckoPrices[key] = price
    return geckoPrices
  }
  const [prices, results] = await Promise.all([
    loadPrices(),
    Promise.all(
      wallets.map(async (w): Promise<BalanceResult> => {
        const chain = chains[w.chain]
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
    const id = chains[r.chain].coingeckoId
    const price = id ? prices[id] : undefined
    r.usd = r.ok && price !== undefined ? Number(r.balance) * price : null
  }

  return { results, prices }
}
