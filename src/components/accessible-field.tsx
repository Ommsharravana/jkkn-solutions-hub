import { forwardRef, type InputHTMLAttributes } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface AccessibleFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  hint?: string
}

export const AccessibleField = forwardRef<HTMLInputElement, AccessibleFieldProps>(
  ({ label, error, hint, id, className, required, ...props }, ref) => {
    const fieldId = id || `field-${label.toLowerCase().replace(/\s+/g, '-')}`
    const errorId = `${fieldId}-error`
    const hintId = `${fieldId}-hint`

    return (
      <div className={cn('space-y-2', className)}>
        <Label htmlFor={fieldId} className="flex items-center gap-1">
          {label}
          {required && <span className="text-destructive" aria-hidden="true">*</span>}
          {required && <span className="sr-only">(required)</span>}
        </Label>

        {hint && (
          <p id={hintId} className="text-sm text-muted-foreground">
            {hint}
          </p>
        )}

        <Input
          ref={ref}
          id={fieldId}
          aria-required={required}
          aria-invalid={!!error}
          aria-describedby={cn(
            error && errorId,
            hint && hintId
          ) || undefined}
          className={cn(error && 'border-destructive')}
          {...props}
        />

        {error && (
          <p id={errorId} className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
      </div>
    )
  }
)

AccessibleField.displayName = 'AccessibleField'
