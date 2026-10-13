import { useState, useCallback, useRef } from 'react'

export function useToast() {
  const [toasts, setToasts] = useState([])
  const seq = useRef(0)
  const addToast = useCallback((msg, type = 'success') => {
    seq.current += 1
    const id = seq.current
    setToasts((t) => [...t, { id, msg, type }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3800)
  }, [])
  return { toasts, addToast }
}
