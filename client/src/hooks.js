import { useCallback, useRef, useState } from 'react'
import { api } from './api.js'

/** جلب المواعيد + إعدادات القواعد من الخادم */
export function useSlots() {
  const [state, setState] = useState({
    loading: true, error: null, date: null, today: null,
    days: [], courts: [], rules: null, now: null,
  })
  const seq = useRef(0)

  const load = useCallback(async (date, employeeId) => {
    const mine = ++seq.current
    setState((s) => ({ ...s, loading: true, error: null }))
    const q = new URLSearchParams()
    if (date) q.set('date', date)
    if (employeeId) q.set('employeeId', employeeId)
    const { ok, data, status } = await api(`api/slots?${q.toString()}`)
    if (mine !== seq.current) return null // طلب أقدم — نتجاهله
    if (!ok) {
      setState((s) => ({
        ...s, loading: false,
        error: status === 404 ? 'الواجهة البرمجية غير متاحة على هذا العنوان.' : (data.error || 'تعذّر جلب المواعيد من الخادم.'),
      }))
      return null
    }
    setState({
      loading: false, error: null,
      date: data.date, today: data.today, days: data.days,
      courts: data.courts, rules: data.rules, now: data.now,
    })
    return data
  }, [])

  return { ...state, load }
}
