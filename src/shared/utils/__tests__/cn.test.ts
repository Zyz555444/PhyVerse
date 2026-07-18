import { describe, it, expect } from 'vitest'
import { cn } from '../cn'

describe('cn', () => {
  it('joins multiple class names', () => {
    expect(cn('a', 'b', 'c')).toBe('a b c')
  })

  it('ignores falsy values', () => {
    expect(cn('a', false, null, undefined, '', 'b')).toBe('a b')
  })

  it('supports conditional object syntax', () => {
    expect(cn('base', { active: true, disabled: false })).toBe('base active')
  })

  it('flattens arrays of class values', () => {
    expect(cn(['a', 'b'], 'c')).toBe('a b c')
  })

  it('merges conflicting tailwind classes, keeping the last', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4')
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
  })

  it('returns an empty string with no arguments', () => {
    expect(cn()).toBe('')
  })
})
