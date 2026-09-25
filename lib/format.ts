const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 })

export function formatUsd(value: number) {
  return usd.format(value)
}

export function formatBalance(value: string) {
  const [whole, fraction = ''] = value.split('.')
  const grouped = BigInt(whole.replace('-', '') || '0').toLocaleString('en-US')
  const sign = whole.startsWith('-') ? '-' : ''
  const digits = whole.length > 3 ? 2 : 6
  const trimmed = fraction.slice(0, digits).replace(/0+$/, '')
  return `${sign}${grouped}${trimmed ? `.${trimmed}` : ''}`
}

export function shortenAddress(address: string, chars = 6) {
  if (address.length <= chars * 2 + 3) return address
  return `${address.slice(0, chars)}…${address.slice(-4)}`
}
