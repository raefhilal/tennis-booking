import { Lock, Sun } from 'lucide-react'

export default function DateStrip({ days, value, onSelect }) {
  return (
    <div className="datestrip" role="tablist" aria-label="اختيار اليوم">
      {days.map((d) => {
        const active = d.date === value
        return (
          <button
            key={d.date}
            role="tab"
            aria-selected={active}
            className={`daychip ${active ? 'active' : ''} ${d.state === 'locked' ? 'locked' : ''}`}
            onClick={() => onSelect(d.date)}
          >
            <span className="dow">
              {d.isToday ? 'اليوم' : d.weekday}
            </span>
            <span className="dom">{d.day}</span>
            <span className="mon">{d.month}</span>
            {d.state === 'locked' && (
              <span className="lock"><Lock size={11} strokeWidth={2.25} aria-hidden="true" /> مغلق</span>
            )}
            {d.state === 'open' && d.isToday && (
              <span className="lock" style={{ color: 'var(--court2)' }}>
                <Sun size={11} strokeWidth={2.25} aria-hidden="true" /> {d.open} مواعيد
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
