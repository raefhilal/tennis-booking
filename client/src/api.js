// مسار الواجهة البرمجية — يعمل على رابط المعاينة وعلى /p/{deployId}/
export function apiUrl(path) {
  const clean = String(path).replace(/^\/+/, '')
  const base = document.baseURI || window.location.href
  return new URL(clean, base).toString()
}

/** طلب واحد مع مهلة زمنية ومعالجة أخطاء الشبكة (بدون رمي استثناء) */
async function once(path, { retries, timeout = 9000, ...options }) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeout)
  try {
    const res = await fetch(apiUrl(path), {
      cache: 'no-store',
      signal: ctrl.signal,
      headers: { 'Content-Type': 'application/json' },
      ...options,
    })
    let data = null
    try { data = await res.json() } catch (e) { data = { ok: false, error: 'رد غير مفهوم من الخادم.' } }
    return { ok: res.ok && data && data.ok !== false, status: res.status, data: data || {}, network: true }
  } catch (e) {
    return { ok: false, status: 0, data: { ok: false, error: 'تعذّر الوصول إلى الخادم — تتم إعادة المحاولة.' }, network: false }
  } finally {
    clearTimeout(timer)
  }
}

/**
 * طلب مع إعادة محاولة تلقائية عند انقطاع الشبكة (تشغيل بارد للخادم).
 * الطلبات المعدِّلة (POST/DELETE) لا تُعاد تلقائياً لتجنّب التكرار.
 */
export async function api(path, options = {}) {
  const isWrite = options.method && options.method !== 'GET'
  const attempts = options.retries != null ? options.retries : (isWrite ? 1 : 3)
  let last = null
  for (let i = 0; i < attempts; i++) {
    last = await once(path, options)
    if (last.network) return last
    if (i < attempts - 1) await new Promise((r) => setTimeout(r, 700 * (i + 1)))
  }
  return last
}
