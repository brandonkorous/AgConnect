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
  // Zod 4's ZodType is a deeply-recursive generic; passing TValues through
  // zodResolver triggers TS2589. We launder the schema through `never` so
  // the resolver's inference can't traverse it, then assert the result as
  // the resolver shape useForm expects.
  const form = useForm<TValues>({
    resolver: zodResolver(schema as never) as never,
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
