import { CheckCircle2, AlertCircle } from 'lucide-react'

export default function Toasts({ toasts }) {
  return (
    <div className="toast-wrap" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.type}`}>
          {t.type === 'success'
            ? <CheckCircle2 size={18} strokeWidth={1.75} aria-hidden="true" />
            : <AlertCircle size={18} strokeWidth={1.75} aria-hidden="true" />}
          <span>{t.msg}</span>
        </div>
      ))}
    </div>
  )
}
