import { CalendarPlus, CheckCircle2, Ban, Lock, Clock, TriangleAlert } from 'lucide-react'

const LABEL = {
  available: { text: 'متاح', icon: CalendarPlus, cta: 'احجز الآن' },
  mine: { text: 'حجزك', icon: CheckCircle2, cta: 'إدارة الحجز' },
  booked: { text: 'محجوز', icon: Ban, cta: '' },
  locked: { text: 'لم يُفتح بعد', icon: Lock, cta: '' },
  past: { text: 'انتهى وقته', icon: Clock, cta: '' },
  limit: { text: 'تجاوزت الحد', icon: TriangleAlert, cta: '' },
}

export default function SlotButton({ slot, onSelect }) {
  if (slot.status === 'loading') {
    return <div className="slot skeleton" aria-hidden="true" />
  }
  const meta = LABEL[slot.status] || LABEL.available
  const Icon = meta.icon
  const clickable = slot.status === 'available' || slot.status === 'mine'
  const title = slot.reason || meta.text

  return (
    <button
      type="button"
      className={`slot ${slot.status}`}
      disabled={!clickable}
      onClick={() => clickable && onSelect(slot)}
      title={title}
      aria-label={`${slot.label} إلى ${slot.endLabel} — ${meta.text}`}
    >
      <span className="time">{slot.label} – {slot.endLabel}</span>
      <span className="state">
        <Icon size={14} strokeWidth={1.75} aria-hidden="true" /> {meta.text}
      </span>
      {meta.cta && <span className="cta">{meta.cta}</span>}
      {slot.status === 'mine' && slot.ref && <span className="badge grey">{slot.ref}</span>}
    </button>
  )
}
