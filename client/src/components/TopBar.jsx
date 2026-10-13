import { Moon, Sun, IdCard, Pencil, CalendarDays, TicketCheck, CircleHelp } from 'lucide-react'

export default function TopBar({ tab, setTab, theme, toggleTheme, employeeId, onEditId }) {
  const tabs = [
    { id: 'book', label: 'حجز ملعب', icon: CalendarDays },
    { id: 'mine', label: 'حجوزاتي', icon: TicketCheck },
    { id: 'rules', label: 'القواعد', icon: CircleHelp },
  ]
  return (
    <header className="navbar">
      <div className="nav-inner">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
              <circle cx="12" cy="12" r="9" />
              <path d="M6.5 5.6C9.2 8.3 9.2 15.7 6.5 18.4M17.5 5.6C14.8 8.3 14.8 15.7 17.5 18.4" />
            </svg>
          </span>
          <span>
            حجز ملاعب التنس
            <small>ملعبان · ساعة لكل حجز · ٣ عصراً – ٩ مساءً</small>
          </span>
        </div>

        <nav className="tabs" aria-label="أقسام الموقع">
          {tabs.map((t) => (
            <button key={t.id} className={`tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)} aria-current={tab === t.id ? 'page' : undefined}>
              <t.icon size={16} strokeWidth={1.8} aria-hidden="true" /> {t.label}
            </button>
          ))}
        </nav>

        <div className="nav-actions">
          {employeeId ? (
            <button className="badge green" onClick={onEditId} title="تغيير الرقم الوظيفي" style={{ padding: '.4rem .7rem', cursor: 'pointer' }}>
              <IdCard size={14} strokeWidth={1.75} aria-hidden="true" /> {employeeId}
              <Pencil size={12} strokeWidth={1.75} aria-hidden="true" />
            </button>
          ) : null}
          <button className="icon-btn" onClick={toggleTheme} aria-label={theme === 'dark' ? 'الوضع الفاتح' : 'الوضع الليلي'}>
            {theme === 'dark' ? <Sun size={18} strokeWidth={1.75} /> : <Moon size={18} strokeWidth={1.75} />}
          </button>
        </div>
      </div>
    </header>
  )
}
