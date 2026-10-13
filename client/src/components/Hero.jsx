import { RefreshCw, Info, Clock3, Layers2, CalendarCheck2 } from 'lucide-react'

export default function Hero({ rules, error, loading, onRefresh }) {
  if (!rules) return null
  const fmt = (h) => `${String(h).padStart(2, '0')}:00`
  const ruleText = rules.leadTimeMode === 'minimum'
    ? `الحجز قبل ${rules.leadTimeHours} ساعة على الأقل`
    : `الحجز مُتاح خلال ${rules.leadTimeHours} ساعة القادمة فقط`

  return (
    <section className="hero">
      <div className="hero-panel">
        <div className="hero-head">
          <div className="hero-copy">
            <span className="eyebrow">
              <Info size={13} strokeWidth={2} aria-hidden="true" /> الحجز بالرقم الوظيفي · بدون تسجيل
            </span>
            <h1>موعدك القادم<br /><span>على أرض الملعب</span></h1>
            <p>
              احجز ملعب التنس لمدة ساعة واحدة. {rules.courts.length} ملعبان متاحان طوال الأسبوع،
              {' '}{ruleText}.
            </p>
          </div>
          <div className="hero-actions">
            <span className="availability"><i aria-hidden="true" /> اختر من المواعيد المتاحة</span>
            <button className="btn btn-ghost" onClick={onRefresh} disabled={loading}>
              <RefreshCw size={16} strokeWidth={1.75} className={loading ? 'spin' : ''} aria-hidden="true" />
              تحديث المواعيد
            </button>
          </div>
        </div>
        <div className="hero-facts" aria-label="معلومات الحجز">
          <div className="hero-fact"><span className="fact-icon"><Clock3 size={18} aria-hidden="true" /></span><span><b>{fmt(rules.openHour)} – {fmt(rules.closeHour)}</b><small>أوقات اللعب اليومية</small></span></div>
          <div className="hero-fact"><span className="fact-icon"><Layers2 size={18} aria-hidden="true" /></span><span><b>{rules.courts.length} ملعبان</b><small>اختر الملعب المتاح</small></span></div>
          <div className="hero-fact"><span className="fact-icon"><CalendarCheck2 size={18} aria-hidden="true" /></span><span><b>{rules.slotMinutes} دقيقة</b><small>مدة الحجز الواحد</small></span></div>
        </div>
      </div>
      {error && <div className="rule" role="alert"><span className="rule-mark" aria-hidden="true">!</span><div><b>تعذّر الاتصال</b><span>{error}</span></div></div>}
    </section>
  )
}
