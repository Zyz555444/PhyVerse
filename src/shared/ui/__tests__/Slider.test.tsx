import { describe, it, expect } from 'vitest'
import { renderWithProviders, screen } from '@/test/utils'
import { Slider } from '../Slider'

describe('Slider', () => {
  it('renders label and initial value', () => {
    renderWithProviders(<Slider label="Volume" value={[42]} min={0} max={100} step={1} />)
    expect(screen.getByText('Volume')).toBeInTheDocument()
    expect(screen.getByText('42')).toBeInTheDocument()
  })

  it('formats value when formatter is provided', () => {
    renderWithProviders(
      <Slider
        label="Gravity"
        value={[9.8]}
        min={0}
        max={20}
        step={0.1}
        valueFormatter={(v) => `${v.toFixed(1)} m/s²`}
      />
    )
    expect(screen.getByText('9.8 m/s²')).toBeInTheDocument()
  })
})
