'use client';

import { FormProvider, useForm, type DefaultValues, type FieldValues, type SubmitHandler, type UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';

export type FormSubmitContext<TValues extends FieldValues> = {
  setErrors: (fields: Record<string, string>) => void;
  reset: UseFormReturn<TValues>['reset'];
  form: UseFormReturn<TValues>;
};

export type FormProps<TValues extends FieldValues> = {
  schema: z.ZodType<TValues>;
  defaultValues: DefaultValues<TValues>;
  onSubmit: (values: TValues, ctx: FormSubmitContext<TValues>) => void | Promise<void>;
  children: React.ReactNode;
  className?: string;
  id?: string;
};

export function Form<TValues extends FieldValues>({
  schema,
  defaultValues,
  onSubmit,
  children,
  className,
  id,
}: FormProps<TValues>) {
  const form = useForm<TValues>({
    resolver: zodResolver(schema as z.ZodType<TValues>) as never,
    defaultValues,
    mode: 'onTouched',
  });

  const handler: SubmitHandler<TValues> = async (values) => {
    await onSubmit(values, {
      setErrors: (fields) => {
        for (const [name, message] of Object.entries(fields)) {
          form.setError(name as never, { type: 'server', message });
        }
      },
      reset: form.reset,
      form,
    });
  };

  return (
    <FormProvider {...form}>
      <form
        id={id}
        className={className}
        noValidate
        onSubmit={form.handleSubmit(handler)}
      >
        {children}
      </form>
    </FormProvider>
  );
}
