// Lightweight observability helpers (no external deps)
// Usage: const span = startApiSpan('assignedPatients'); ... finally span.end(res)

export interface ApiSpanMeta {
  name: string
  id: string
  start: number
  data: Record<string, any>
  end: (response?: Response | { status?: number }) => void
}

function makeId(len = 12) {
  const chars = 'abcdef0123456789'
  let out = ''
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)]
  return out
}

export function startApiSpan(name: string, extra: Record<string, any> = {}): ApiSpanMeta {
  const id = makeId()
  const start = Date.now()
  const meta: ApiSpanMeta = {
    name,
    id,
    start,
    data: { ...extra },
    end: (response?: Response | { status?: number }) => {
      const duration = Date.now() - start
      // eslint-disable-next-line no-console
      console.log(`🛰️ API-SPAN ${name}#${id} duration=${duration}ms status=${(response as any)?.status ?? 'n/a'}`, meta.data)
    }
  }
  // eslint-disable-next-line no-console
  console.log(`🛰️ API-SPAN-START ${name}#${id}`, extra)
  return meta
}

export function withNoCacheHeaders(init?: { headers?: Record<string,string> }) {
  return {
    ...init,
    headers: {
      'Cache-Control': 'no-cache, no-store, max-age=0, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      ...(init?.headers || {})
    }
  }
}

export function attachDiagHeaders(obj: any, span: ApiSpanMeta) {
  return {
    ...obj,
    headers: {
      ...(obj?.headers || {}),
      'x-correlation-id': span.id,
      'x-api-span': span.name,
      'x-server-time': new Date().toISOString()
    }
  }
}
