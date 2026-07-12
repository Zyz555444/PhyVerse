import * as RadixSlider from '@radix-ui/react-slider'
import { cn } from '@/shared/utils/cn'
import { forwardRef } from 'react'

export interface SliderProps extends RadixSlider.SliderProps {
  label?: string
  showValue?: boolean
  valueFormatter?: (value: number) => string
}

export const Slider = forwardRef<HTMLSpanElement, SliderProps>(
  ({ className, label, showValue = true, valueFormatter, value, ...props }, ref) => {
    const currentValue = value ?? props.defaultValue ?? [0]

    return (
      <div className={cn('flex flex-col gap-2', className)}>
        {(label || showValue) && (
          <div className="flex items-center justify-between">
            {label && <span className="text-sm font-medium text-text-primary">{label}</span>}
            {showValue && (
              <span className="text-xs font-mono text-text-secondary">
                {valueFormatter ? valueFormatter(currentValue[0]) : currentValue[0]}
              </span>
            )}
          </div>
        )}
        <RadixSlider.Root
          ref={ref}
          value={value}
          className="relative flex h-5 w-full touch-none select-none items-center"
          {...props}
        >
          <RadixSlider.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-paper-tertiary">
            <RadixSlider.Range className="absolute h-full rounded-full bg-accent" />
          </RadixSlider.Track>
          <RadixSlider.Thumb
            className={cn(
              'block h-4 w-4 rounded-full border border-border bg-paper shadow-sm transition-colors',
              'hover:border-accent hover:bg-accent-soft',
              'focus:outline-none focus:ring-2 focus:ring-accent-soft focus:ring-offset-1 focus:ring-offset-paper'
            )}
          />
        </RadixSlider.Root>
      </div>
    )
  }
)

Slider.displayName = 'Slider'
