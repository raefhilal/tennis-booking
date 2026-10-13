import { useCallback, useEffect, useState } from 'react'
import { Search, TicketCheck, Clock3, Trash2, CalendarX2, Loader2 } from 'lucide-react'
import { api } from '../api.js'

export default function MyBookings({ profile, setProfile, addToast, refreshKey }) {
  const [employeeId, setEmployeeId] = useState(profile.employeeId || '')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [pending, setPending] = useState(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async (id) => {
    if (!/^[0-9A-Za-z-]{3,12}$/.test(id)) {
      addToast('أدخل رقمك الوظيفي بشكل صحيح لعرض الحجوزات.', 'error')
      return
    }
    setLoading(true)
    const { ok, data: res } = await api(`api/bookings?employeeId=${encodeURIComponent(id)}`)
    setLoading(false)
    if (!ok) { addToast(res.error || 'تعذّر جلب الحجوزات.', 'error'); return }
    setData(res)
    if (profile.employeeId !== id) setProfile((p) => ({ ...p, employeeId: id }))
  }, [addToast, profile.employeeId, setProfile])

  useEffect(() => {
    if (profile.employeeId) { setEmployeeId(profile.employeeId); load(profile.employeeId) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey])

  const cancel = async (booking) => {
    setBusy(true)
    const { ok, data: res } = await api(`api/bookings/${booking.id}?employeeId=${encodeURIComponent(employeeId)}`, { method: 'DELETE' })
    setBusy(false)
    if (!ok) { addToast(res.error || 'تعذّر إلغاء الحجز.', 'error'); return }
    addToast(`تم إلغاء الحجز ${booking.ref} — الوقت متاح الآن للآخرين.`, 'success')
    setPending(null)
    load(employeeId)
    setProfile((p) => ({ ...p, _v: Date.now() }))
  }

  return (
    <div className="stack">
      <section className="card fade-up">
        <h2 className="section-title"><TicketCheck size={19} strokeWidth={1.75} aria-hidden="true" /> حجوزاتي</h2>
        <div className="lookup">
          <div className="field">
            <label htmlFor="emp-lookup">الرقم الوظيفي</label>
            <input id="emp-lookup" value={employeeId} inputMode="numeric" placeholder="مثال: 10245"
              onChange={(e) => setEmployeeId(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && load(employeeId.trim())} />
          </div>
          <button className="btn btn-primary" onClick={() => load(employeeId.trim())} disabled={loading}>
            {loading ? <Loader2 size={18} strokeWidth={1.75} className="spin" aria-hidden="true" /> : <Search size={18} strokeWidth={1.75} aria-hidden="true" />}
            {loading ? 'جارٍ البحث…' : 'عرض الحجوزات'}
          </button>
        </div>
      </section>

      {loading && (
        <section className="card" aria-busy="true">
          {[0, 1, 2].map((i) => <div key={i} className="slot skeleton" style={{ height: 58 }} />)}
        </section>
      )}

      {!loading && data && (
        <section className="card fade-up d1">
          <div className="stats">
            <div className="stat"><b>{data.upcoming.length}</b><span>حجز قادم</span></div>
            <div className="stat"><b>{data.past.length}</b><span>حجز سابق</span></div>
            <div className="stat"><b>{employeeId || data.employeeId}</b><span>الرقم الوظيفي</span></div>
          </div>

          {data.upcoming.length === 0 ? (
            <div className="empty">
              <div className="icon-wrap"><CalendarX2 size={24} strokeWidth={1.75} aria-hidden="true" /></div>
              <b>لا توجد حجوزات قادمة</b>
              <p>اختر يوماً ووقتاً من تبويب «حجز ملعب» للبدء.</p>
            </div>
          ) : (
            data.upcoming.map((b) => (
              <div className="booking-row" key={b.id}>
                <div className="when">
                  <b>{b.day?.label}</b>
                  <span>{b.label} – {b.endLabel || ''} · {b.courtName}</span>
                </div>
                <div className="meta">
                  <span className="badge green">مؤكد</span>
                  <span className="badge grey">{b.ref}</span>
                </div>
                <div className="actions">
                  {pending === b.id ? (
                    <>
                      <button className="btn btn-danger btn-sm" disabled={busy} onClick={() => cancel(b)}>
                        <Trash2 size={15} strokeWidth={1.75} aria-hidden="true" /> تأكيد الإلغاء
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={() => setPending(null)} disabled={busy}>رجوع</button>
                    </>
                  ) : (
                    <button className="btn btn-ghost btn-sm" onClick={() => setPending(b.id)}>
                      <Trash2 size={15} strokeWidth={1.75} aria-hidden="true" /> إلغاء
                    </button>
                  )}
                </div>
              </div>
            ))
          )}

          {data.past.length > 0 && (
            <>
              <hr className="divider" />
              <h3 className="section-title" style={{ fontSize: '.9rem' }}><Clock3 size={16} strokeWidth={1.75} aria-hidden="true" /> سجل الحجوزات السابقة</h3>
              {data.past.map((b) => (
                <div className="booking-row dim" key={b.id}>
                  <div className="when"><b>{b.day?.label}</b><span>{b.label} · {b.courtName}</span></div>
                  <div className="meta"><span className="badge grey">منتهي</span></div>
                </div>
              ))}
            </>
          )}
        </section>
      )}
    </div>
  )
}
