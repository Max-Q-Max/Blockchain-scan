export type ChainKind = 'evm' | 'bitcoin' | 'solana'

export type Chain = {
  id: string
  name: string
  symbol: string
  decimals: number
  kind: ChainKind
  coingeckoId: string
  explorerName: string
  explorerAddressUrl: (address: string) => string
  rpcUrl?: string
}

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

export const CHAIN_BY_ID = Object.fromEntries(CHAINS.map((c) => [c.id, c])) as Record<string, Chain>

const EVM_RE = /^0x[a-fA-F0-9]{40}$/
const BTC_RE = /^(bc1[a-z0-9]{25,87}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})$/
const SOL_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/

export function isValidAddress(chain: Chain, address: string): boolean {
  switch (chain.kind) {
    case 'evm':
      return EVM_RE.test(address)
    case 'bitcoin':
      return BTC_RE.test(address)
    case 'solana':
      return SOL_RE.test(address)
  }
}

export function detectChain(address: string): string | null {
  const a = address.trim()
  if (EVM_RE.test(a)) return 'eth'
  if (BTC_RE.test(a)) return 'btc'
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

export function decodeWallets(value: string | undefined | null): Wallet[] {
  if (!value) return []
  const seen = new Set<string>()
  const wallets: Wallet[] = []
  for (const part of value.split(',')) {
    const [chain, address, label] = part.split(':')
    const c = CHAIN_BY_ID[chain]
    if (!c || !address || !isValidAddress(c, address)) continue
    const w: Wallet = { chain, address, label: label ? safeDecode(label) : undefined }
    if (seen.has(walletKey(w))) continue
    seen.add(walletKey(w))
    wallets.push(w)
  }
  return wallets.slice(0, 25)
}

function safeDecode(v: string) {
  try {
    return decodeURIComponent(v).slice(0, 40)
  } catch {
    return undefined
  }
}
