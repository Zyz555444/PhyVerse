import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDebounce, useDebouncedCallback } from '../useDebounce'

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns the initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 200))
    expect(result.current).toBe('initial')
  })

  it('only updates the value after the delay elapses', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 200), {
      initialProps: { value: 'a' },
    })

    rerender({ value: 'b' })
    expect(result.current).toBe('a')

    act(() => {
      vi.advanceTimersByTime(199)
    })
    expect(result.current).toBe('a')

    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(result.current).toBe('b')
  })

  it('resets the timer when the value changes rapidly', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 200), {
      initialProps: { value: 'a' },
    })

    rerender({ value: 'b' })
    act(() => {
      vi.advanceTimersByTime(150)
    })
    rerender({ value: 'c' })
    act(() => {
      vi.advanceTimersByTime(150)
    })
    // The second change restarted the timer, so it is not settled yet.
    expect(result.current).toBe('a')

    act(() => {
      vi.advanceTimersByTime(50)
    })
    expect(result.current).toBe('c')
  })
})

describe('useDebouncedCallback', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('invokes the callback only after the delay', () => {
    const cb = vi.fn()
    const { result } = renderHook(() => useDebouncedCallback(cb, 300))

    act(() => {
      result.current('x')
    })
    expect(cb).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(300)
    })
    expect(cb).toHaveBeenCalledExactlyOnceWith('x')
  })

  it('collapses rapid calls into a single trailing invocation', () => {
    const cb = vi.fn()
    const { result } = renderHook(() => useDebouncedCallback(cb, 300))

    act(() => {
      result.current(1)
      result.current(2)
      result.current(3)
    })

    act(() => {
      vi.advanceTimersByTime(300)
    })
    expect(cb).toHaveBeenCalledTimes(1)
    expect(cb).toHaveBeenCalledWith(3)
  })

  it('cancels a pending call when the component unmounts', () => {
    const cb = vi.fn()
    const { result, unmount } = renderHook(() => useDebouncedCallback(cb, 300))

    act(() => {
      result.current('pending')
    })
    unmount()

    act(() => {
      vi.advanceTimersByTime(300)
    })
    expect(cb).not.toHaveBeenCalled()
  })
})
