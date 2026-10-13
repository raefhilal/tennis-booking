import { useCallback, useEffect, useState } from 'react'
import TopBar from './components/TopBar.jsx'
import Hero from './components/Hero.jsx'
import DateStrip from './components/DateStrip.jsx'
import CourtColumn from './components/CourtColumn.jsx'
import BookingModal from './components/BookingModal.jsx'
import ManageModal from './components/ManageModal.jsx'
import MyBookings from './components/MyBookings.jsx'
import RulesPanel from './components/RulesPanel.jsx'
import Toasts from './components/Toasts.jsx'
import { useToast } from './useToast.js'
import { useSlots } from './hooks.js'
import { api } from './api.js'

const read = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch (e) { return fallback }
}

export default function App() {
  const { toasts, addToast } = useToast()
  const slots = useSlots()
  const [tab, setTab] = useState('book')
  const [theme, setTheme] = useState(() => read('tb_theme', 'light'))
  const [profile, setProfile] = useState(() => read('tb_profile', { employeeId: '', name: '', phone: '' }))
  const [modal, setModal] = useState(null)
  const [busy, setBusy] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('tb_theme', JSON.stringify(theme))
  }, [theme])

  useEffect(() => { localStorage.setItem('tb_profile', JSON.stringify(profile)) }, [profile])

  useEffect(() => { slots.load(undefined, profile.employeeId) }, []) // eslint-disable-line

  const selectDate = useCallback((date) => slots.load(date, profile.employeeId), [slots.load, profile.employeeId])
  const refresh = useCallback(() => slots.load(slots.date, profile.employeeId), [slots.load, slots.date, profile.employeeId])

  const openSlot = (court, slot) => {
    if (slot.status === 'available') setModal({ mode: 'book', court, slot })
    else if (slot.status === 'mine') setModal({ mode: 'manage', court, slot })
  }

  const book = async (payload) => {
    setBusy(true)
    const { ok, data } = await api('api/bookings', { method: 'POST', body: JSON.stringify({ ...payload, date: slots.date }) })
    setBusy(false)
    if (!ok) {
      addToast(data.error || 'تعذّر إتمام الحجز.', 'error')
      if (data.code === 'conflict' || data.code === 'past') { setModal(null); refresh() }
      return
    }
    setProfile({ employeeId: payload.employeeId, name: payload.name, phone: payload.phone || '' })
    setModal(null)
    addToast(`تم تأكيد الحجز ${data.booking.ref} — ${data.booking.courtName} الساعة ${data.booking.label}`, 'success')
    refresh()
    setRefreshKey((k) => k + 1)
  }

  const cancel = async (bookingId) => {
    if (!bookingId) return
    setBusy(true)
    const { ok, data } = await api(`api/bookings/${bookingId}?employeeId=${encodeURIComponent(profile.employeeId)}`, { method: 'DELETE' })
    setBusy(false)
    if (!ok) { addToast(data.error || 'تعذّر إلغاء الحجز.', 'error'); return }
    setModal(null)
    addToast('تم إلغاء الحجز وتحرير الوقت.', 'success')
    refresh()
    setRefreshKey((k) => k + 1)
  }

  const dateInfo = slots.days?.find((d) => d.date === slots.date) || null
  const todayOpen = slots.days?.find((d) => d.isToday)

  return (
    <>
      <TopBar
        tab={tab}
        setTab={setTab}
        theme={theme}
        toggleTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
        employeeId={profile.employeeId}
        onEditId={() => { setTab('mine'); addToast('أدخل رقمك الوظيفي لتعديله أو لعرض حجوزاتك.', 'success') }}
      />

      <main className="shell">
        <Hero rules={slots.rules} error={slots.error} loading={slots.loading} onRefresh={refresh} />

        {tab === 'book' && (
          <div className="stack">
            <DateStrip days={slots.days} value={slots.date} onSelect={selectDate} />
            {todayOpen && todayOpen.locked > 0 && (
              <div className="rule fade-up" role="note">
                <span className="rule-mark" aria-hidden="true">i</span>
                <div>
                  <b>لماذا بعض الأيام مغلقة؟</b>
                  <span>
                    الحجز يُفتح فقط قبل {slots.rules?.leadTimeHours} ساعة من موعد اللعب، لذلك تظهر الأيام الأبعد
                    بقفل حتى يقترب موعدها. الليلة مثلاً يمكنك حجز مواعيد الغد حتى نفس الساعة من الغد.
                  </span>
                </div>
              </div>
            )}
            <div className="grid grid-courts">
              {slots.loading
                ? [0, 1].map((i) => (
                    <section className="card" key={i} aria-busy="true">
                      <div className="slot skeleton" style={{ height: 34, marginBottom: '1rem' }} />
                      {[0, 1, 2, 3, 4, 5].map((s) => <div key={s} className="slot skeleton" />)}
                    </section>
                  ))
                : slots.courts.map((court, i) => (
                    <CourtColumn key={court.id} court={court} index={i} onSelect={(slot) => openSlot(court, slot)} />
                  ))}
            </div>
          </div>
        )}

        {tab === 'mine' && (
          <MyBookings profile={profile} setProfile={setProfile} addToast={addToast} refreshKey={refreshKey} />
        )}

        {tab === 'rules' && <RulesPanel rules={slots.rules} />}

        <footer className="footer">
          <b>{slots.rules?.facility || 'ملاعب التنس'}</b> — التوقيت المرجعي {slots.rules?.tz} ·
          الحجز ساعة واحدة · {slots.rules?.courts?.length || 2} ملعبان · جميع أيام الأسبوع
        </footer>
      </main>

      {modal?.mode === 'book' && (
        <BookingModal
          court={modal.court} dateInfo={dateInfo} slot={modal.slot} profile={profile} busy={busy}
          onClose={() => setModal(null)} onBook={book}
        />
      )}
      {modal?.mode === 'manage' && (
        <ManageModal
          court={modal.court} dateInfo={dateInfo} slot={modal.slot} busy={busy}
          onClose={() => setModal(null)} onCancel={cancel}
        />
      )}

      <Toasts toasts={toasts} />
    </>
  )
}
