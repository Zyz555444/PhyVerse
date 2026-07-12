import { describe, it, expect, vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, screen } from '@/test/utils'
import { Switch } from '../Switch'

describe('Switch', () => {
  it('renders with a label', () => {
    renderWithProviders(<Switch label="Airplane mode" />)
    expect(screen.getByRole('switch')).toBeInTheDocument()
    expect(screen.getByText('Airplane mode')).toBeInTheDocument()
  })

  it('toggles when clicked', async () => {
    const onCheckedChange = vi.fn()
    renderWithProviders(<Switch onCheckedChange={onCheckedChange} />)
    const sw = screen.getByRole('switch')
    await userEvent.click(sw)
    expect(onCheckedChange).toHaveBeenCalledWith(true)
  })
})
