import { useEffect, useState } from 'react'

export default function useDebounce<T>(value: T, delay = 250): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedValue(value), delay)
    return () => window.clearTimeout(id)
  }, [value, delay])

  return debouncedValue
}
