import type { Chain } from '@/lib/chains'

const TIMEOUT_MS = 10_000

async function fetchJson(url: string) {
  const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS), cache: 'no-store', redirect: 'error' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

async function rpc(url: string, method: string, params: unknown[]) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', method, params, id: 1 }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  if (data.error) throw new Error(data.error.message ?? `RPC error: ${data.error.code}`)
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
      // Raptoreum uses /api/getaddressbalance endpoint
      if (chain.id === 'rtm') {
        try {
          const data = await fetchJson(`${chain.explorerApiUrl}/api/getaddressbalance?address=${encodeURIComponent(address)}`)
          // Handle the case where balanceRTM might be 0, undefined, or string
          const balance = data.balanceRTM !== undefined && data.balanceRTM !== null ? data.balanceRTM : (data.balance ?? 0)
          return { raw: parseUnits(String(balance), chain.decimals), txCount: null }
        } catch (err) {
          // Try alternative format
          const altData = await fetchJson(`${chain.explorerApiUrl}/api/getaddress/${encodeURIComponent(address)}`)
          const balance = altData.balance ?? altData.balanceRTM ?? 0
          return { raw: parseUnits(String(balance), chain.decimals), txCount: null }
        }
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
  const match = /^(-?)(\d+)(?:\.(\d+))?$/.exec(value.trim())
  if (!match) throw new Error('Unexpected balance format from explorer')
  const [, sign, whole, fraction = ''] = match
  const raw = BigInt(whole + fraction.padEnd(decimals, '0').slice(0, decimals))
  return sign ? -raw : raw
}

async function getExplorerPrice(chain: Chain): Promise<number | null> {
  try {
    if (chain.kind === 'evm') {
      const data = await fetchJson(`https://api.coingecko.com/api/v3/simple/price?ids=${chain.coingeckoId}&vs_currencies=usd`)
      return data[chain.coingeckoId!]?.usd ?? null
    } else if (chain.kind === 'bitcoin') {
      const data = await fetchJson('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd')
      return data.bitcoin?.usd ?? null
    } else if (chain.kind === 'solana') {
      const data = await fetchJson('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd')
      return data.solana?.usd ?? null
    }
  } catch {}
  return null
}

export async function getBalances(chains: Chain[], wallets: Array<{ chain: string; address: string }>): Promise<{ results: { chain: string; address: string; balance: string; txCount: number | null }[]; prices: Record<string, number>; fetchedAt: string }> {
  const chainMap = new Map(chains.map((c) => [c.id, c]))
  const results = await Promise.all(
    wallets.map(async (w) => {
      const chain = chainMap.get(w.chain)!
      try {
        const { raw, txCount } = await getRawBalance(chain, w.address)
        return { chain: w.chain, address: w.address, balance: formatUnits(raw, chain.decimals), txCount }
      } catch (err) {
        return { chain: w.chain, address: w.address, balance: '0', txCount: null, error: String(err) }
      }
    })
  )

  const prices = await getPrices(chains.filter((c) => c.coingeckoId).map((c) => c.coingeckoId!))
  return { results, prices, fetchedAt: new Date().toISOString() }
}

export async function getPrices(ids: string[]): Promise<Record<string, number>> {
  if (ids.length === 0) return {}
  try {
    const data = await fetchJson(`https://api.coingecko.com/api/v3/simple/price?ids=${ids.join(',')}&vs_currencies=usd`)
    const result: Record<string, number> = {}
    for (const [id, priceData] of Object.entries(data)) {
      result[id] = (priceData as Record<string, number>).usd ?? 0
    }
    return result
  } catch (err) {
    console.error('Price fetch error:', err)
    return {}
  }
}
