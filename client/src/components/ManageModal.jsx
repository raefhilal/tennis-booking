import { useEffect, useState } from 'react'
import { X, ShieldCheck, Trash2, TriangleAlert } from 'lucide-react'
import SlotSummary from './SlotSummary.jsx'

export default function ManageModal({ court, dateInfo, slot, busy, onClose, onCancel }) {
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label="إدارة الحجز">
        <div className="modal-head">
          <div>
            <h3>حجزك مؤكد</h3>
            <p>رقم الحجز: <b>{slot.ref}</b></p>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="إغلاق"><X size={18} strokeWidth={1.75} /></button>
        </div>

        <SlotSummary court={court} dateInfo={dateInfo} slot={slot} />

        <div className="rule" style={{ marginBottom: '1rem' }}>
          <span className="rule-mark"><ShieldCheck size={18} strokeWidth={1.75} aria-hidden="true" /></span>
          <div>
            <b>يُرجى الحضور في الوقت المحدد</b>
            <span>يمكنك إلغاء الحجز في أي وقت قبل بدايته، وسيتحرر الوقت لغيره.</span>
          </div>
        </div>

        {confirming ? (
          <div className="callout-warn" style={{ marginBottom: '1rem' }}>
            <TriangleAlert size={16} strokeWidth={1.75} aria-hidden="true" />
            <span>هل تريد إلغاء هذا الحجز نهائياً؟</span>
          </div>
        ) : null}

        <div className="modal-actions">
          {confirming ? (
            <>
              <button type="button" className="btn btn-danger" disabled={busy} onClick={() => onCancel(slot.bookingId)}>
                <Trash2 size={18} strokeWidth={1.75} aria-hidden="true" /> {busy ? 'جارٍ الإلغاء…' : 'نعم، ألغِ الحجز'}
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setConfirming(false)} disabled={busy}>رجوع</button>
            </>
          ) : (
            <>
              <button type="button" className="btn btn-danger" onClick={() => setConfirming(true)}>
                <Trash2 size={18} strokeWidth={1.75} aria-hidden="true" /> إلغاء الحجز
              </button>
              <button type="button" className="btn btn-ghost" onClick={onClose}>إغلاق</button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
