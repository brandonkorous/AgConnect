'use client';

import { ValidationSummary } from './ValidationSummary';
import type { FieldError } from './validation';

type Props = {
    fieldErrors: FieldError[];
    error: string | null;
    renotifyMsg: string | null;
};

export function FormAlerts({ fieldErrors, error, renotifyMsg }: Props) {
    return (
        <>
            {fieldErrors.length > 0 && <ValidationSummary errors={fieldErrors} />}
            {error && (
                <div role="alert" className="alert alert-error alert-soft mb-5 text-sm">
                    {error}
                </div>
            )}
            {renotifyMsg && (
                <div role="status" className="alert alert-info alert-soft mb-5 text-sm">
                    {renotifyMsg}
                </div>
            )}
        </>
    );
}
