'use client';

import { useFormContext } from 'react-hook-form';

export type FormSubmitProps = {
  children: React.ReactNode;
  submittingLabel?: React.ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost';
};

export function FormSubmit({
  children,
  submittingLabel,
  className = '',
  variant = 'primary',
}: FormSubmitProps) {
  const { formState } = useFormContext();
  const submitting = formState.isSubmitting;
  return (
    <button
      type="submit"
      disabled={submitting}
      aria-busy={submitting}
      className={`btn btn-${variant} ${className}`.trim()}
    >
      {submitting ? (
        <>
          <span className="loading loading-spinner loading-sm" aria-hidden />
          {submittingLabel ?? children}
        </>
      ) : (
        children
      )}
    </button>
  );
}
