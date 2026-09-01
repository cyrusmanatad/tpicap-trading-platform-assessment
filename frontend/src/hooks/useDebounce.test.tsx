import { render } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import useDebounce from './useDebounce'

function TestComponent({ value, delay }: { value: string; delay: number }) {
  const debounced = useDebounce(value, delay)
  return <div data-testid="out">{debounced}</div>
}

describe('useDebounce', () => {
  it('debounces value changes by the given delay', async () => {
    vi.useFakeTimers()

    const { getByTestId, rerender } = render(<TestComponent value="a" delay={200} />)
    expect(getByTestId('out').textContent).toBe('a')

    // update to new value
    rerender(<TestComponent value="ab" delay={200} />)

    // before timers advance, value should still be old
    expect(getByTestId('out').textContent).toBe('a')

    // advance time less than delay
    vi.advanceTimersByTime(150)
    expect(getByTestId('out').textContent).toBe('a')

    // advance past delay
    vi.advanceTimersByTime(100)
    expect(getByTestId('out').textContent).toBe('ab')

    vi.useRealTimers()
  })
})
