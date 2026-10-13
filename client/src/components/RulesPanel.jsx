import { Clock, CalendarRange, Timer, IdCard, CalendarClock, Layers, CircleHelp } from 'lucide-react'

export default function RulesPanel({ rules }) {
  if (!rules) return null
  const fmt = (h) => `${String(h).padStart(2, '0')}:00`
  const twentyFour = rules.leadTimeMode === 'minimum'
    ? `يجب الحجز قبل ${rules.leadTimeHours} ساعة على الأقل من موعد اللعب.`
    : `لا يمكن الحجز قبل أكثر من ${rules.leadTimeHours} ساعة من موعد اللعب — يُفتح الوقت للحجز قبل ${rules.leadTimeHours} ساعة فقط.`

  const items = [
    { icon: IdCard, title: 'الحجز بالرقم الوظيفي', text: 'لا حاجة لحساب أو كلمة مرور — أدخل رقمك الوظيفي واسمك لتأكيد الحجز.' },
    { icon: CalendarClock, title: `قاعدة الـ ${rules.leadTimeHours} ساعة`, text: twentyFour },
    { icon: Timer, title: 'مدة الحجز ساعة واحدة', text: `كل حجز يحجز الملعب لمدة ${rules.slotMinutes} دقيقة كاملة، ويمكن اختيار أي وقت متاح.` },
    { icon: Clock, title: `التوقيت: من ${fmt(rules.openHour)} حتى ${fmt(rules.closeHour)}`, text: 'المواعيد متاحة على فترات ساعة كاملة (٣ عصراً، ٤، ٥، ٦، ٧، و٨ مساءً).' },
    { icon: CalendarRange, title: 'جميع أيام الأسبوع', text: 'الملاعب متاحة من الأحد إلى السبت بدون استثناء.' },
    { icon: Layers, title: `${rules.courts.length} ملعبان متطابقان`, text: 'يمكنك اختيار الملعب الأول أو الثاني حسب التوفر.' },
    ...(rules.maxActivePerEmployee > 0
      ? [{ icon: CircleHelp, title: `حد الحجوزات القادمة: ${rules.maxActivePerEmployee}`, text: 'لضمان العدالة، لا يُسمح بأكثر من هذا العدد من الحجوزات القادمة لكل رقم وظيفي في الوقت نفسه.' }]
      : []),
  ]

  return (
    <section className="card fade-up" aria-label="قواعد الحجز">
      <h2 className="section-title"><CircleHelp size={19} strokeWidth={1.75} aria-hidden="true" /> قواعد الحجز</h2>
      <div className="rules">
        {items.map((it) => (
          <div className="rule" key={it.title}>
            <span className="rule-mark"><it.icon size={18} strokeWidth={1.75} aria-hidden="true" /></span>
            <div><b>{it.title}</b><span>{it.text}</span></div>
          </div>
        ))}
      </div>
      <p style={{ marginTop: '1rem', fontSize: '.82rem', color: 'var(--text-muted)' }}>
        التوقيت المرجعي للملعب: {rules.tz}. لأي استفسار أو تعديل على القواعد، تواصل مع إدارة المرافق.
      </p>
    </section>
  )
}
