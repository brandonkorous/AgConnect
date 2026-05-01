'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import { useState } from 'react';
import { useSignIn } from '@clerk/nextjs';
import { useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPhone, faEnvelope } from '@fortawesome/free-solid-svg-icons';
import { faGoogle as faGoogleBrand } from '@fortawesome/free-brands-svg-icons';
import { isEmail, normalizeUsPhone, clerkErrorMessage } from './authShared';

type Step = 'identifier' | 'password' | 'verify';

type Props = { locale: string };

export function SignInForm({ locale }: Props) {
  const router = useRouter();
  const tShared = useTranslations('auth.shared');
  const tErrors = useTranslations('auth.shared.errors');
  const t = useTranslations('auth.sign_in');
  const { signIn } = useSignIn();

  const [step, setStep] = useState<Step>('identifier');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const postAuthHref = `/${locale}/post-auth` as Route;

  function classify(input: string) {
    if (isEmail(input)) return { kind: 'email' as const, value: input.trim() };
    const phone = normalizeUsPhone(input);
    if (phone) return { kind: 'phone' as const, value: phone };
    return null;
  }

  async function startIdentifier() {
    if (!signIn) return;
    const classified = classify(identifier);
    if (!classified) {
      setError(tErrors('invalid_identifier'));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const createResult = await signIn.create({ identifier: classified.value });
      if (createResult.error) throw createResult.error;

      if (classified.kind === 'phone') {
        const sendResult = await signIn.phoneCode.sendCode({});
        if (sendResult.error) throw sendResult.error;
        setStep('verify');
      } else {
        setStep('password');
      }
    } catch (e) {
      setError(clerkErrorMessage(e, tErrors('no_account')));
    } finally {
      setSubmitting(false);
    }
  }

  async function submitPassword() {
    if (!signIn) return;
    setSubmitting(true);
    setError(null);
    try {
      const passwordResult = await signIn.password({ password });
      if (passwordResult.error) throw passwordResult.error;
      if (signIn.status !== 'complete') {
        setError(tErrors('generic'));
        return;
      }
      const finalizeResult = await signIn.finalize();
      if (finalizeResult.error) throw finalizeResult.error;
      router.replace(postAuthHref);
    } catch (e) {
      setError(clerkErrorMessage(e, tErrors('generic')));
    } finally {
      setSubmitting(false);
    }
  }

  async function verifyCode() {
    if (!signIn) return;
    setSubmitting(true);
    setError(null);
    try {
      const verifyResult = await signIn.phoneCode.verifyCode({ code: code.trim() });
      if (verifyResult.error) throw verifyResult.error;
      if (signIn.status !== 'complete') {
        setError(tErrors('generic'));
        return;
      }
      const finalizeResult = await signIn.finalize();
      if (finalizeResult.error) throw finalizeResult.error;
      router.replace(postAuthHref);
    } catch (e) {
      setError(clerkErrorMessage(e, tErrors('invalid_code')));
    } finally {
      setSubmitting(false);
    }
  }

  async function continueWithGoogle() {
    if (!signIn) return;
    try {
      const ssoResult = await signIn.sso({
        strategy: 'oauth_google',
        redirectUrl: postAuthHref,
        redirectCallbackUrl: `/${locale}/sso-callback`,
      });
      if (ssoResult.error) throw ssoResult.error;
    } catch (e) {
      setError(clerkErrorMessage(e, tErrors('generic')));
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    if (step === 'identifier') return startIdentifier();
    if (step === 'password') return submitPassword();
    return verifyCode();
  }

  return (
    <div className="bg-base-100 border-base-300 rounded-2xl border p-7 shadow-md">
      <div className="mb-6">
        <p className="text-base-content/60 font-mono text-[10px] font-bold uppercase tracking-[0.18em]">
          {t('eyebrow')}
        </p>
        <h1 className="font-display mt-2 text-3xl font-light leading-tight tracking-tight">
          {t('title_a')}{' '}
          <em className="text-primary not-italic font-light">{t('title_b')}</em>
        </h1>
        <p className="text-base-content/65 mt-2 text-sm leading-relaxed">{t('subtitle')}</p>
      </div>

      {step === 'identifier' && (
        <>
          <button
            type="button"
            onClick={continueWithGoogle}
            disabled={submitting}
            className="btn btn-outline border-base-300 hover:bg-base-200 mb-4 w-full justify-center gap-3 rounded-full text-sm font-semibold"
          >
            <FontAwesomeIcon icon={faGoogleBrand} className="h-4 w-4" />
            {tShared('google')}
          </button>
          <div className="text-base-content/40 mb-4 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.2em]">
            <span className="bg-base-300 h-px flex-1" />
            {tShared('or')}
            <span className="bg-base-300 h-px flex-1" />
          </div>
        </>
      )}

      <form onSubmit={handleSubmit} noValidate className="grid gap-4">
        {step === 'identifier' && (
          <Field label={t('identifier_label')} help={t('identifier_help')}>
            <IconInput icon={isEmail(identifier) ? faEnvelope : faPhone}>
              <input
                type="text"
                inputMode="email"
                autoComplete="username"
                placeholder={t('identifier_placeholder')}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="grow bg-transparent outline-none"
                required
              />
            </IconInput>
          </Field>
        )}

        {step === 'password' && (
          <>
            <p className="text-base-content/70 text-sm">
              {t('password_subtitle', { target: identifier })}
            </p>
            <Field label={t('password_label')}>
              <input
                type="password"
                autoComplete="current-password"
                placeholder={t('password_placeholder')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input input-bordered w-full"
                required
                minLength={8}
              />
            </Field>
          </>
        )}

        {step === 'verify' && (
          <>
            <p className="text-base-content/70 text-sm">
              {t('verify_subtitle', { target: identifier })}
            </p>
            <Field label={t('code_label')}>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]*"
                maxLength={6}
                value={code}
                onChange={(e) =>
                  setCode(e.target.value.replace(/\D+/g, '').slice(0, 6))
                }
                className="input input-bordered w-full text-center font-mono text-xl tracking-[0.4em]"
                required
              />
            </Field>
          </>
        )}

        {error && (
          <div role="alert" className="alert alert-error alert-soft text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="btn btn-primary mt-1 w-full rounded-full font-semibold"
        >
          {submitting
            ? step === 'verify'
              ? tShared('verifying')
              : tShared('submitting')
            : tShared('submit')}
        </button>
      </form>

      {step === 'identifier' && (
        <div className="border-base-300 mt-5 flex flex-wrap items-center justify-between gap-3 border-t pt-4 text-sm">
          <Link
            href={`/${locale}/worker/sign-up` as Route}
            className="text-base-content/65 hover:text-base-content text-xs no-underline"
          >
            <span>{t('no_account')}</span>{' '}
            <span className="text-primary font-semibold">{t('sign_up_worker')}</span>
          </Link>
          <Link
            href={`/${locale}/employer/sign-up` as Route}
            className="text-primary text-xs font-semibold no-underline hover:underline"
          >
            {t('sign_up_employer')}
          </Link>
        </div>
      )}

      {(step === 'password' || step === 'verify') && (
        <div className="border-base-300 mt-4 border-t pt-4">
          <button
            type="button"
            onClick={() => {
              setStep('identifier');
              setError(null);
              setCode('');
              setPassword('');
            }}
            className="text-base-content/60 hover:text-base-content text-xs no-underline"
          >
            ← {t('back_to_identifier')}
          </button>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  help,
  children,
}: {
  label: string;
  help?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-base-content/80 mb-1.5 block text-[13px] font-semibold">
        {label}
      </label>
      {children}
      {help && <p className="text-base-content/55 mt-1.5 text-[11px]">{help}</p>}
    </div>
  );
}

function IconInput({
  icon,
  children,
}: {
  icon: typeof faPhone;
  children: React.ReactNode;
}) {
  return (
    <label className="input input-bordered flex w-full items-center gap-2">
      <FontAwesomeIcon icon={icon} className="text-base-content/40 h-3.5 w-3.5" />
      {children}
    </label>
  );
}
