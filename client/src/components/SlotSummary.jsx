import { CalendarDays, Clock, MapPin } from 'lucide-react'

export default function SlotSummary({ court, dateInfo, slot }) {
  return (
    <div className="summary">
      <div className="row"><span><MapPin size={14} strokeWidth={1.75} aria-hidden="true" /> الملعب</span><b>{court?.short}</b></div>
      <div className="row"><span><CalendarDays size={14} strokeWidth={1.75} aria-hidden="true" /> التاريخ</span><b>{dateInfo?.label}</b></div>
      <div className="row"><span><Clock size={14} strokeWidth={1.75} aria-hidden="true" /> الوقت</span><b>{slot?.label} – {slot?.endLabel}</b></div>
      <div className="row"><span>المدة</span><b>ساعة واحدة</b></div>
    </div>
  )
}
