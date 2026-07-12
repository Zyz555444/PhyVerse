import * as RadixSelect from '@radix-ui/react-select'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '@/shared/utils/cn'
import { forwardRef, type ReactNode } from 'react'

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

export interface SelectProps extends RadixSelect.SelectProps {
  placeholder?: string
  options: SelectOption[]
  label?: string
}

export const Select = forwardRef<HTMLButtonElement, SelectProps>(
  ({ placeholder, options, label, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && <label className="text-sm font-medium text-text-primary">{label}</label>}
        <RadixSelect.Root {...props}>
          <RadixSelect.Trigger
            ref={ref}
            className={cn(
              'inline-flex h-10 w-full items-center justify-between rounded-lg border border-border',
              'bg-paper px-3 text-sm text-text-primary',
              'hover:border-border-strong',
              'focus:outline-none focus:ring-2 focus:ring-accent-soft focus:ring-offset-1 focus:ring-offset-paper',
              'disabled:cursor-not-allowed disabled:opacity-50',
              'data-[placeholder]:text-text-tertiary'
            )}
          >
            <RadixSelect.Value placeholder={placeholder} />
            <RadixSelect.Icon>
              <ChevronDown className="h-4 w-4 text-text-tertiary" />
            </RadixSelect.Icon>
          </RadixSelect.Trigger>
          <RadixSelect.Portal>
            <RadixSelect.Content
              position="popper"
              sideOffset={4}
              className={cn(
                'z-50 max-h-64 min-w-[var(--radix-select-trigger-width)] overflow-hidden',
                'rounded-lg border border-border bg-paper shadow-lg'
              )}
            >
              <RadixSelect.Viewport className="p-1">
                {options.map((option) => (
                  <SelectItem key={option.value} value={option.value} disabled={option.disabled}>
                    {option.label}
                  </SelectItem>
                ))}
              </RadixSelect.Viewport>
            </RadixSelect.Content>
          </RadixSelect.Portal>
        </RadixSelect.Root>
      </div>
    )
  }
)

Select.displayName = 'Select'

const SelectItem = forwardRef<
  HTMLDivElement,
  RadixSelect.SelectItemProps & { children: ReactNode }
>(({ children, className, ...props }, ref) => {
  return (
    <RadixSelect.Item
      ref={ref}
      className={cn(
        'relative flex h-9 cursor-pointer select-none items-center rounded-md px-6 py-2 text-sm text-text-primary',
        'outline-none transition-colors hover:bg-paper-secondary focus:bg-paper-secondary',
        'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        className
      )}
      {...props}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        <RadixSelect.ItemIndicator>
          <Check className="h-4 w-4 text-accent" />
        </RadixSelect.ItemIndicator>
      </span>
      <RadixSelect.ItemText>{children}</RadixSelect.ItemText>
    </RadixSelect.Item>
  )
})

SelectItem.displayName = 'SelectItem'
