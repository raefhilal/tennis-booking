import SlotButton from './SlotButton.jsx'

export default function CourtColumn({ court, index, onSelect }) {
  const color = index === 0 ? 'var(--court1)' : 'var(--court2)'
  const free = court.slots.filter((s) => s.status === 'available').length
  const mine = court.slots.filter((s) => s.status === 'mine').length

  return (
    <section className="card fade-up d2" aria-label={court.name}>
      <header className="court-head">
        <span className="court-dot" style={{ background: color }} aria-hidden="true" />
        <div>
          <h3>{court.name}</h3>
          <span className="sub">حجز ساعة واحدة</span>
        </div>
        <span className="court-legend">
          {free} متاح {mine > 0 ? `· ${mine} لك` : ''}
        </span>
      </header>
      {court.slots.map((slot) => (
        <SlotButton key={slot.startISO} slot={slot} onSelect={onSelect} />
      ))}
    </section>
  )
}
