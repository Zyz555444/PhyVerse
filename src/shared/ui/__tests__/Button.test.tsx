import { describe, it, expect, vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, screen } from '@/test/utils'
import { Button } from '../Button'

describe('Button', () => {
  it('renders children', () => {
    renderWithProviders(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
  })

  it('handles click events', async () => {
    const handleClick = vi.fn()
    renderWithProviders(<Button onClick={handleClick}>Submit</Button>)
    await userEvent.click(screen.getByRole('button', { name: 'Submit' }))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('is disabled when loading', () => {
    renderWithProviders(<Button isLoading>Loading</Button>)
    expect(screen.getByRole('button', { name: 'Loading' })).toBeDisabled()
  })

  it('is disabled when disabled prop is set', () => {
    renderWithProviders(<Button disabled>Disabled</Button>)
    expect(screen.getByRole('button', { name: 'Disabled' })).toBeDisabled()
  })
})
