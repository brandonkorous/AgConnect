'use client';

import { useFormContext, type FieldValues, type Path } from 'react-hook-form';

export type FieldProps<TValues extends FieldValues> = {
  name: Path<TValues>;
  label: string;
  type?: React.HTMLInputTypeAttribute;
  placeholder?: string;
  hint?: string;
  autoComplete?: string;
  required?: boolean;
  inputMode?: 'text' | 'email' | 'tel' | 'numeric' | 'url' | 'search';
};

export function Field<TValues extends FieldValues>({
  name,
  label,
  type = 'text',
  placeholder,
  hint,
  autoComplete,
  required,
  inputMode,
}: FieldProps<TValues>) {
  const { register, formState } = useFormContext<TValues>();
  const error = formState.errors[name as keyof typeof formState.errors];
  const errorMessage = (error && typeof error === 'object' && 'message' in error
    ? (error.message as string | undefined)
    : undefined) ?? null;

  const id = `field-${String(name)}`;
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;

  return (
    <fieldset className="fieldset w-full min-w-0">
      <legend className="fieldset-legend" id={`${id}-label`}>
        {label}
        {required && <span className="text-error ml-1">*</span>}
      </legend>
      <input
        id={id}
        type={type}
        inputMode={inputMode}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-invalid={errorMessage ? true : undefined}
        aria-describedby={[errorMessage ? errorId : null, hint ? hintId : null]
          .filter(Boolean)
          .join(' ') || undefined}
        className={`input ${errorMessage ? 'input-error' : ''}`}
        {...register(name)}
      />
      {hint && !errorMessage && (
        <p id={hintId} className="label text-xs">
          {hint}
        </p>
      )}
      {errorMessage && (
        <p id={errorId} role="alert" className="label text-error text-xs">
          {errorMessage}
        </p>
      )}
    </fieldset>
  );
}
