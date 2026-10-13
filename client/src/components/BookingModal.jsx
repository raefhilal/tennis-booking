import { useEffect, useState } from 'react'
import { X, BadgeCheck, IdCard, User, Phone } from 'lucide-react'
import Field from './Field.jsx'
import SlotSummary from './SlotSummary.jsx'

export default function BookingModal({ court, dateInfo, slot, profile, busy, onClose, onBook }) {
  const [employeeId, setEmployeeId] = useState(profile.employeeId || '')
  const [name, setName] = useState(profile.name || '')
  const [phone, setPhone] = useState(profile.phone || '')
  const [errors, setErrors] = useState({})

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const validate = () => {
    const e = {}
    if (!/^[0-9A-Za-z-]{3,12}$/.test(employeeId.trim())) e.employeeId = 'أدخل الرقم الوظيفي (٣–١٢ رقماً أو حرفاً).'
    if (name.trim().length < 3) e.name = 'الاسم مطلوب (٣ أحرف على الأقل).'
    if (phone.trim() && !/^[0-9+\s-]{8,20}$/.test(phone.trim())) e.phone = 'رقم الجوال غير صحيح.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const submit = (ev) => {
    ev.preventDefault()
    if (!validate()) return
    onBook({ employeeId: employeeId.trim(), name: name.trim(), phone: phone.trim(), courtId: court.id, hour: slot.hour })
  }

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form className="modal" onSubmit={submit} role="dialog" aria-modal="true" aria-label="تأكيد الحجز">
        <div className="modal-head">
          <div>
            <h3>تأكيد حجز الملعب</h3>
            <p>الحجز بالرقم الوظيفي — الحجز ساعة واحدة فقط.</p>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="إغلاق"><X size={18} strokeWidth={1.75} /></button>
        </div>

        <SlotSummary court={court} dateInfo={dateInfo} slot={slot} />

        <Field id="emp" label="الرقم الوظيفي" icon={IdCard} value={employeeId} error={errors.employeeId}
          inputMode="numeric" autoComplete="off" placeholder="مثال: 10245" autoFocus
          onChange={(e) => setEmployeeId(e.target.value)} />
        <Field id="nm" label="الاسم الكامل" icon={User} value={name} error={errors.name}
          placeholder="الاسم كما في السجلات" onChange={(e) => setName(e.target.value)} />
        <Field id="ph" label="رقم الجوال (اختياري)" icon={Phone} value={phone} error={errors.phone}
          inputMode="tel" placeholder="9xxxxxxx" onChange={(e) => setPhone(e.target.value)} />

        <div className="modal-actions">
          <button type="submit" className="btn btn-court" disabled={busy}>
            <BadgeCheck size={18} strokeWidth={1.75} aria-hidden="true" />
            {busy ? 'جارٍ الحجز…' : 'تأكيد الحجز'}
          </button>
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={busy}>إلغاء</button>
        </div>
      </form>
    </div>
  )
}
