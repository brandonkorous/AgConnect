'use client';

import {
    useCallback,
    useEffect,
    useRef,
    useState,
    type FormEvent,
    type ReactNode,
} from 'react';

type FormCaptureProps = {
    onInvalidCapture: (event: FormEvent<HTMLFormElement>) => void;
    onChangeCapture: (event: FormEvent<HTMLFormElement>) => void;
    onSubmitCapture: (event: FormEvent<HTMLFormElement>) => void;
    noValidate: boolean;
};

type FormErrorsApi = {
    errors: Record<string, string>;
    formProps: FormCaptureProps;
};

type Props = {
    requiredMessage: string;
    children: (render: FormErrorsApi) => ReactNode;
};

type Focusable = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

function isFocusable(element: EventTarget | null): element is Focusable {
    return (
        element instanceof HTMLInputElement ||
        element instanceof HTMLSelectElement ||
        element instanceof HTMLTextAreaElement
    );
}

function elementName(element: EventTarget | null): string | null {
    if (!isFocusable(element)) return null;
    return element.name || null;
}

export function useFormErrors(requiredMessage: string): FormErrorsApi {
    const [errors, setErrors] = useState<Record<string, string>>({});
    const firstInvalidRef = useRef<Focusable | null>(null);
    const seenRef = useRef<Set<string>>(new Set());

    const onInvalidCapture = useCallback(
        (event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            const target = event.target;
            if (!isFocusable(target)) return;
            const name = target.name;
            if (!name) return;
            if (!seenRef.current.has(name)) {
                seenRef.current.add(name);
                if (!firstInvalidRef.current) firstInvalidRef.current = target;
            }
            setErrors((prev) => ({ ...prev, [name]: requiredMessage }));
        },
        [requiredMessage],
    );

    const onChangeCapture = useCallback((event: FormEvent<HTMLFormElement>) => {
        const target = event.target;
        if (!isFocusable(target)) return;
        const name = elementName(target);
        if (!name) return;
        if (target.validity.valid) {
            setErrors((prev) => {
                if (!(name in prev)) return prev;
                const next = { ...prev };
                delete next[name];
                return next;
            });
            seenRef.current.delete(name);
        }
    }, []);

    const onSubmitCapture = useCallback(() => {
        seenRef.current = new Set();
        firstInvalidRef.current = null;
        setErrors({});
    }, []);

    useEffect(() => {
        const first = firstInvalidRef.current;
        if (!first) return;
        first.scrollIntoView({ behavior: 'smooth', block: 'center' });
        first.focus({ preventScroll: true });
        firstInvalidRef.current = null;
    }, [errors]);

    return {
        errors,
        formProps: {
            onInvalidCapture,
            onChangeCapture,
            onSubmitCapture,
            noValidate: false,
        },
    };
}

export function FormErrorSummary({ requiredMessage, children }: Props) {
    const api = useFormErrors(requiredMessage);
    return <>{children(api)}</>;
}

export function FieldError({ message }: { message?: string }) {
    if (!message) return null;
    return (
        <p role="alert" className="label text-error text-xs">
            {message}
        </p>
    );
}
