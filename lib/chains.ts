export type ChainKind = 'evm' | 'bitcoin' | 'solana' | 'iquidus'

export type Chain = {
  id: string
  name: string
  symbol: string
  decimals: number
  kind: ChainKind
  /** Price key. For `iquidus` chains the USD price comes from the explorer itself, not CoinGecko. */
  coingeckoId?: string
  explorerApiUrl?: string
  explorerName?: string
  explorerAddressUrl?: (address: string) => string
  rpcUrl?: string
  custom?: boolean
}

export type CustomNetwork = {
  id: string
  name: string
  symbol: string
  rpcUrl: string
  explorerUrl?: string
  coingeckoId?: string
}

export type ChainMap = Record<string, Chain>

export const CHAINS: Chain[] = [
  {
    id: 'eth',
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18,
    kind: 'evm',
    coingeckoId: 'ethereum',
    explorerName: 'Etherscan',
    explorerAddressUrl: (a) => `https://etherscan.io/address/${a}`,
    rpcUrl: 'https://ethereum-rpc.publicnode.com',
  },
  {
    id: 'btc',
    name: 'Bitcoin',
    symbol: 'BTC',
    decimals: 8,
    kind: 'bitcoin',
    coingeckoId: 'bitcoin',
    explorerName: 'mempool.space',
    explorerAddressUrl: (a) => `https://mempool.space/address/${a}`,
  },
  {
    id: 'sol',
    name: 'Solana',
    symbol: 'SOL',
    decimals: 9,
    kind: 'solana',
    coingeckoId: 'solana',
    explorerName: 'Solscan',
    explorerAddressUrl: (a) => `https://solscan.io/account/${a}`,
    rpcUrl: 'https://api.mainnet-beta.solana.com',
  },
  {
    id: 'ysbs',
    name: 'Yerbas',
    symbol: 'YERB',
    decimals: 8,
    kind: 'iquidus',
    coingeckoId: 'yerbas',
    explorerName: 'explorer.yerbas.org',
    explorerApiUrl: 'https://explorer.yerbas.org',
    explorerAddressUrl: (a) => `https://explorer.yerbas.org/address/${a}`,
  },
  {
    id: 'base',
    name: 'Base',
    symbol: 'ETH',
    decimals: 18,
    kind: 'evm',
    coingeckoId: 'ethereum',
    explorerName: 'BaseScan',
    explorerAddressUrl: (a) => `https://basescan.org/address/${a}`,
    rpcUrl: 'https://base-rpc.publicnode.com',
  },
  {
    id: 'arb',
    name: 'Arbitrum',
    symbol: 'ETH',
    decimals: 18,
    kind: 'evm',
    coingeckoId: 'ethereum',
    explorerName: 'Arbiscan',
    explorerAddressUrl: (a) => `https://arbiscan.io/address/${a}`,
    rpcUrl: 'https://arbitrum-one-rpc.publicnode.com',
  },
  {
    id: 'polygon',
    name: 'Polygon',
    symbol: 'POL',
    decimals: 18,
    kind: 'evm',
    coingeckoId: 'polygon-ecosystem-token',
    explorerName: 'PolygonScan',
    explorerAddressUrl: (a) => `https://polygonscan.com/address/${a}`,
    rpcUrl: 'https://polygon-bor-rpc.publicnode.com',
  },
  {
    id: 'bsc',
    name: 'BNB Chain',
    symbol: 'BNB',
    decimals: 18,
    kind: 'evm',
    coingeckoId: 'binancecoin',
    explorerName: 'BscScan',
    explorerAddressUrl: (a) => `https://bscscan.com/address/${a}`,
    rpcUrl: 'https://bsc-rpc.publicnode.com',
  },
]

export const CHAIN_BY_ID = Object.fromEntries(CHAINS.map((c) => [c.id, c])) as ChainMap

export const PRESET_NETWORKS: CustomNetwork[] = [
  {
    id: 'op',
    name: 'Optimism',
    symbol: 'ETH',
    rpcUrl: 'https://optimism-rpc.publicnode.com',
    explorerUrl: 'https://optimistic.etherscan.io',
    coingeckoId: 'ethereum',
  },
  {
    id: 'avax',
    name: 'Avalanche C-Chain',
    symbol: 'AVAX',
    rpcUrl: 'https://avalanche-c-chain-rpc.publicnode.com',
    explorerUrl: 'https://snowtrace.io',
    coingeckoId: 'avalanche-2',
  },
  {
    id: 'gnosis',
    name: 'Gnosis',
    symbol: 'xDAI',
    rpcUrl: 'https://gnosis-rpc.publicnode.com',
    explorerUrl: 'https://gnosisscan.io',
    coingeckoId: 'xdai',
  },
  {
    id: 'linea',
    name: 'Linea',
    symbol: 'ETH',
    rpcUrl: 'https://linea-rpc.publicnode.com',
    explorerUrl: 'https://lineascan.build',
    coingeckoId: 'ethereum',
  },
  {
    id: 'scroll',
    name: 'Scroll',
    symbol: 'ETH',
    rpcUrl: 'https://scroll-rpc.publicnode.com',
    explorerUrl: 'https://scrollscan.com',
    coingeckoId: 'ethereum',
  },
]

export const MAX_CUSTOM_NETWORKS = 10

const IPV4_RE = /^\d{1,3}(\.\d{1,3}){3}$/
const BLOCKED_HOST_SUFFIXES = ['localhost', '.local', '.internal', '.lan', '.home.arpa']

export function isSafePublicUrl(value: string): boolean {
  if (value.length > 200) return false
  let url: URL
  try {
    url = new URL(value)
  } catch {
    return false
  }
  if (url.protocol !== 'https:' || url.username || url.password) return false
  const host = url.hostname.toLowerCase()
  if (!host.includes('.') || IPV4_RE.test(host) || host.startsWith('[')) return false
  return !BLOCKED_HOST_SUFFIXES.some((s) => host === s.replace(/^\./, '') || host.endsWith(s))
}

const ID_RE = /^[a-z0-9-]{1,16}$/
const COINGECKO_RE = /^[a-z0-9-]{1,60}$/

export function sanitizeNetwork(n: Partial<CustomNetwork>): CustomNetwork | null {
  const id = n.id?.trim().toLowerCase() ?? ''
  const name = n.name?.trim().slice(0, 32) ?? ''
  const symbol = n.symbol?.trim().slice(0, 10) ?? ''
  const rpcUrl = n.rpcUrl?.trim() ?? ''
  const explorerUrl = n.explorerUrl?.trim().replace(/\/+$/, '') || undefined
  const coingeckoId = n.coingeckoId?.trim().toLowerCase() || undefined
  if (!ID_RE.test(id) || CHAIN_BY_ID[id] || !name || !symbol || !isSafePublicUrl(rpcUrl)) return null
  if (explorerUrl && !isSafePublicUrl(explorerUrl)) return null
  if (coingeckoId && !COINGECKO_RE.test(coingeckoId)) return null
  return { id, name, symbol, rpcUrl, explorerUrl, coingeckoId }
}

export function slugifyNetworkId(name: string, taken: Set<string>): string {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 12) || 'net'
  let id = base
  for (let i = 2; taken.has(id) || CHAIN_BY_ID[id]; i++) id = `${base.slice(0, 12)}-${i}`
  return id
}

export function networkToChain(n: CustomNetwork): Chain {
  const explorerHost = n.explorerUrl ? new URL(n.explorerUrl).hostname.replace(/^www\./, '') : undefined
  return {
    id: n.id,
    name: n.name,
    symbol: n.symbol,
    decimals: 18,
    kind: 'evm',
    coingeckoId: n.coingeckoId,
    explorerName: explorerHost,
    explorerAddressUrl: n.explorerUrl ? (a) => `${n.explorerUrl}/address/${a}` : undefined,
    rpcUrl: n.rpcUrl,
    custom: true,
  }
}

export function buildChainMap(networks: CustomNetwork[]): ChainMap {
  return { ...CHAIN_BY_ID, ...Object.fromEntries(networks.map((n) => [n.id, networkToChain(n)])) }
}

const NETWORK_FIELDS = ['id', 'name', 'symbol', 'rpcUrl', 'explorerUrl', 'coingeckoId'] as const

export function encodeNetworks(networks: CustomNetwork[]): string {
  return networks.map((n) => NETWORK_FIELDS.map((f) => encodeURIComponent(n[f] ?? '')).join('|')).join(',')
}

export function decodeNetworks(value: string | undefined | null): CustomNetwork[] {
  if (!value) return []
  const networks: CustomNetwork[] = []
  const seen = new Set<string>()
  for (const part of value.split(',')) {
    const fields = part.split('|').map((f) => safeDecode(f, 200) ?? '')
    const n = sanitizeNetwork(Object.fromEntries(NETWORK_FIELDS.map((f, i) => [f, fields[i]])))
    if (!n || seen.has(n.id)) continue
    seen.add(n.id)
    networks.push(n)
  }
  return networks.slice(0, MAX_CUSTOM_NETWORKS)
}

const EVM_RE = /^0x[a-fA-F0-9]{40}$/
const BTC_RE = /^(bc1[a-z0-9]{25,87}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})$/
const SOL_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/
const YERBAS_RE = /^y[1-9A-HJ-NP-Za-km-z]{33}$/

export function isValidAddress(chain: Chain, address: string): boolean {
  switch (chain.kind) {
    case 'evm':
      return EVM_RE.test(address)
    case 'bitcoin':
      return BTC_RE.test(address)
    case 'solana':
      return SOL_RE.test(address)
    case 'iquidus':
      return YERBAS_RE.test(address)
  }
}

export function detectChain(address: string): string | null {
  const a = address.trim()
  if (EVM_RE.test(a)) return 'eth'
  if (BTC_RE.test(a)) return 'btc'
  if (YERBAS_RE.test(a)) return 'ysbs'
  if (SOL_RE.test(a)) return 'sol'
  return null
}

export type Wallet = { chain: string; address: string; label?: string }

export type BalanceResult = {
  chain: string
  address: string
  ok: boolean
  raw?: string
  balance?: string
  usd?: number | null
  txCount?: number | null
  error?: string
}

export function walletKey(w: Wallet) {
  return `${w.chain}:${w.address}`
}

export function encodeWallets(wallets: Wallet[]): string {
  return wallets
    .map((w) => [w.chain, w.address, w.label ? encodeURIComponent(w.label) : ''].filter(Boolean).join(':'))
    .join(',')
}

export function decodeWallets(value: string | undefined | null, chains: ChainMap = CHAIN_BY_ID): Wallet[] {
  if (!value) return []
  const seen = new Set<string>()
  const wallets: Wallet[] = []
  for (const part of value.split(',')) {
    const [chain, address, label] = part.split(':')
    const c = chains[chain]
    if (!c || !address || !isValidAddress(c, address)) continue
    const w: Wallet = { chain, address, label: label ? safeDecode(label, 40) : undefined }
    if (seen.has(walletKey(w))) continue
    seen.add(walletKey(w))
    wallets.push(w)
  }
  return wallets.slice(0, 25)
}

function safeDecode(v: string, max: number) {
  try {
    return decodeURIComponent(v).slice(0, max)
  } catch {
    return undefined
  }
}
