import { NextResponse } from 'next/server'
import { isSafePublicUrl } from '@/lib/chains'
import { verifyEvmRpc } from '@/lib/balances'

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const rpcUrl = typeof body?.rpcUrl === 'string' ? body.rpcUrl.trim() : ''
  if (!isSafePublicUrl(rpcUrl)) {
    return NextResponse.json({ error: 'RPC URL must be a public https:// address (no IPs or localhost).' }, { status: 400 })
  }
  try {
    return NextResponse.json(await verifyEvmRpc(rpcUrl))
  } catch (err) {
    const message = err instanceof Error && err.name !== 'TimeoutError' ? err.message : 'RPC request timed out'
    return NextResponse.json({ error: `Could not reach RPC: ${message}` }, { status: 502 })
  }
}
