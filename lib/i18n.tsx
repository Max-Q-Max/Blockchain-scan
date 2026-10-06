'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export type Locale = 'es' | 'en'

export const TRANSLATIONS = {
  es: {
    // AddWalletForm
    walletAddress: 'Dirección de la wallet',
    addressPlaceholder: '0x…, bc1…, y… (Yerbas), o una dirección Solana',
    network: 'Red',
    addANetwork: 'Agregar una red',
    label: 'Etiqueta',
    optional: '(opcional)',
    labelPlaceholder: 'ej: Cold storage',
    addWallet: 'Agregar billetera',
    invalidAddress: 'Parece que no es una dirección válida de',
    duplicateWallet: 'Esta billetera ya está en tu lista.',
    addAnotherNetwork: '+ Agregar otra red blockchain (Optimism, Avalanche o cualquier RPC EVM)',
    customNetworks: 'Redes personalizadas:',
    addNetwork: '+ Agregar red',
    removeNetworkAria: (name: string) => `Eliminar la red ${name} y sus billeteras`,

    // AddNetworkDialog
    addNetworkTitle: 'Agregar una red',
    addNetworkDesc:
      'Elegí una red EVM popular o conectá cualquier cadena compatible con EVM a través de su endpoint JSON-RPC público.',
    popularNetworks: 'Redes populares',
    customEvmNetwork: 'Red EVM personalizada',
    networkName: 'Nombre de la red',
    networkNamePlaceholder: 'ej: Mantle',
    symbol: 'Símbolo',
    rpcUrl: 'URL del RPC',
    blockExplorerUrl: 'URL del explorador de bloques',
    coingeckoId: 'ID de CoinGecko para el precio en USD',
    coingeckoPlaceholder: 'ej: mantle',
    cancel: 'Cancelar',
    verifyingRpc: 'Verificando RPC…',
    addNetworkBtn: 'Agregar red',
    networkError:
      'Revisá los campos: nombre, símbolo y una URL RPC https:// pública son obligatorios. El explorador también debe ser https://.',
    verificationFailed: 'La verificación falló',

    // WalletTracker
    trackedWallets: 'Billeteras rastreadas',
    portfolioSummary: 'Resumen de cartera',
    totalValue: 'Valor total',
    walletsResolved: 'Billeteras resueltas',
    lastUpdated: 'Última actualización',
    maxWallets: 'Has alcanzado el máximo de',
    maxWalletsSuffix: 'billeteras. Eliminá una para agregar otra.',
    noWallets: 'Sin billeteras aún',
    pasteAddress: 'Pegá una dirección arriba — la red se detecta automáticamente.',
    shareLink: 'Compartir enlace',
    copied: 'Copiado',
    refresh: 'Actualizar',
    export: 'Exportar',
    exporting: 'Exportando…',
    trySample: 'Probar billeteras de ejemplo',
    autoRefresh: 'Auto-actualiza cada 60s',
    pricePrefix: 'Precios:',

    // LanguageSwitcher
    switchToEnglish: 'Switch to English',
    switchToSpanish: 'Cambiar a español',
  },
  en: {
    // AddWalletForm
    walletAddress: 'Wallet address',
    addressPlaceholder: '0x…, bc1…, y… (Yerbas), or a Solana address',
    network: 'Network',
    addANetwork: 'Add a network',
    label: 'Label',
    optional: '(optional)',
    labelPlaceholder: 'e.g. Cold storage',
    addWallet: 'Add wallet',
    invalidAddress: "That doesn't look like a valid address for",
    duplicateWallet: 'This wallet is already on your list.',
    addAnotherNetwork: '+ Add another blockchain network (Optimism, Avalanche, or any EVM RPC)',
    customNetworks: 'Custom networks:',
    addNetwork: '+ Add network',
    removeNetworkAria: (name: string) => `Remove ${name} network and its wallets`,

    // AddNetworkDialog
    addNetworkTitle: 'Add a network',
    addNetworkDesc:
      'Pick a popular EVM network or connect any EVM-compatible chain through its public JSON-RPC endpoint.',
    popularNetworks: 'Popular networks',
    customEvmNetwork: 'Custom EVM network',
    networkName: 'Network name',
    networkNamePlaceholder: 'e.g. Mantle',
    symbol: 'Symbol',
    rpcUrl: 'RPC URL',
    blockExplorerUrl: 'Block explorer URL',
    coingeckoId: 'CoinGecko ID for USD price',
    coingeckoPlaceholder: 'e.g. mantle',
    cancel: 'Cancel',
    verifyingRpc: 'Verifying RPC…',
    addNetworkBtn: 'Add network',
    networkError:
      'Check the fields: name, symbol and a public https:// RPC URL are required. Explorer must also be https://.',
    verificationFailed: 'Verification failed',

    // WalletTracker
    trackedWallets: 'Tracked wallets',
    portfolioSummary: 'Portfolio summary',
    totalValue: 'Total value',
    walletsResolved: 'Wallets resolved',
    lastUpdated: 'Last updated',
    maxWallets: "You're tracking the maximum of",
    maxWalletsSuffix: 'wallets. Remove one to add another.',
    noWallets: 'No wallets yet',
    pasteAddress: 'Paste an address above — the network is detected automatically.',
    shareLink: 'Share link',
    copied: 'Copied',
    refresh: 'Refresh',
    export: 'Export',
    exporting: 'Exporting…',
    trySample: 'Try sample wallets',
    autoRefresh: 'Auto-refreshes every 60s',
    pricePrefix: 'Prices:',

    // LanguageSwitcher
    switchToEnglish: 'Switch to English',
    switchToSpanish: 'Cambiar a español',
  },
} as const

type LocaleContextValue = {
  locale: Locale
  setLocale: (l: Locale) => void
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

const STORAGE_KEY = 'ledgerline-locale'

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('es')

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Locale | null
      if (saved === 'es' || saved === 'en') setLocaleState(saved)
    } catch {
      // ignore
    }
  }, [])

  function setLocale(l: Locale) {
    setLocaleState(l)
    try {
      localStorage.setItem(STORAGE_KEY, l)
    } catch {
      // ignore
    }
  }

  return <LocaleContext.Provider value={{ locale, setLocale }}>{children}</LocaleContext.Provider>
}

export function useLocale() {
  const ctx = useContext(LocaleContext)
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider')
  return ctx
}

export function useT() {
  const { locale } = useLocale()
  return TRANSLATIONS[locale]
}