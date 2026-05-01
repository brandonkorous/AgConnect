'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import { useState } from 'react';
import { useSignUp } from '@clerk/nextjs';
import { useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPhone, faEnvelope } from '@fortawesome/free-solid-svg-icons';
import { faGoogle as faGoogleBrand } from '@fortawesome/free-brands-svg-icons';
import { isEmail, normalizeUsPhone, clerkErrorMessage } from './authShared';

type Mode = 'phone' | 'email';
type Step = 'details' | 'verify';

type Props = { locale: string };

export function WorkerSignUpForm({ locale }: Props) {
  const router = useRouter();
  const tShared = useTranslations('auth.shared');
  const tErrors = useTranslations('auth.shared.errors');
  const t = useTranslations('auth.sign_up_worker');
  const { signUp } = useSignUp();

  const [mode, setMode] = useState<Mode>('phone');
  const [step, setStep] = useState<Step>('details');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const postAuthHref = `/${locale}/post-auth` as Route;

  async function startPhone() {
    if (!signUp) return;
    const phone = normalizeUsPhone(identifier);
    if (!phone) {
      setError(tErrors('invalid_phone'));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const createResult = await signUp.create({
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
        phoneNumber: phone,
        unsafeMetadata: { locale, role: 'worker' },
      });
      if (createResult.error) {
        console.error('[worker-signup-phone] create error', createResult.error);
        throw createResult.error;
      }

      const sendResult = await signUp.verifications.sendPhoneCode({});
      if (sendResult.error) {
        console.error('[worker-signup-phone] sendPhoneCode error', sendResult.error);
        throw sendResult.error;
      }
      setStep('verify');
    } catch (e) {
      console.error('[worker-signup-phone] caught', e);
      setError(clerkErrorMessage(e, tErrors('generic')));
    } finally {
      setSubmitting(false);
    }
  }

  async function startEmail() {
    if (!signUp) return;
    if (!isEmail(identifier)) {
      setError(tErrors('invalid_email'));
      return;
    }
    if (password.length < 8) {
      setError(tErrors('weak_password'));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const createResult = await signUp.create({
        emailAddress: identifier.trim(),
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
        unsafeMetadata: { locale, role: 'worker' },
      });
      if (createResult.error) {
        console.error('[worker-signup-email] create error', createResult.error);
        throw createResult.error;
      }

      const passwordResult = await signUp.password({ password });
      if (passwordResult.error) {
        console.error('[worker-signup-email] password error', passwordResult.error);
        throw passwordResult.error;
      }

      const sendResult = await signUp.verifications.sendEmailCode();
      if (sendResult.error) {
        console.error('[worker-signup-email] sendEmailCode error', sendResult.error);
        throw sendResult.error;
      }
      setStep('verify');
    } catch (e) {
      console.error('[worker-signup-email] caught', e);
      setError(clerkErrorMessage(e, tErrors('generic')));
    } finally {
      setSubmitting(false);
    }
  }

  async function verifyCode() {
    if (!signUp) return;
    setSubmitting(true);
    setError(null);
    try {
      const verifyResult =
        mode === 'phone'
          ? await signUp.verifications.verifyPhoneCode({ code: code.trim() })
          : await signUp.verifications.verifyEmailCode({ code: code.trim() });
      if (verifyResult.error) throw verifyResult.error;
      if (signUp.status !== 'complete') {
        setError(tErrors('generic'));
        return;
      }
      const finalizeResult = await signUp.finalize();
      if (finalizeResult.error) throw finalizeResult.error;
      router.replace(postAuthHref);
    } catch (e) {
      setError(clerkErrorMessage(e, tErrors('invalid_code')));
    } finally {
      setSubmitting(false);
    }
  }

  async function continueWithGoogle() {
    if (!signUp) return;
    try {
      const ssoResult = await signUp.sso({
        strategy: 'oauth_google',
        redirectUrl: postAuthHref,
        redirectCallbackUrl: `/${locale}/sso-callback`,
        unsafeMetadata: { locale, role: 'worker' },
      });
      if (ssoResult.error) throw ssoResult.error;
    } catch (e) {
      setError(clerkErrorMessage(e, tErrors('generic')));
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    if (step === 'verify') return verifyCode();
    return mode === 'phone' ? startPhone() : startEmail();
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

      {step === 'details' && (
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
        {step === 'details' && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={t('first_name_label')}>
              <input
                type="text"
                autoComplete="given-name"
                placeholder={t('first_name_placeholder')}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="input input-bordered w-full"
                required
              />
            </Field>
            <Field label={t('last_name_label')}>
              <input
                type="text"
                autoComplete="family-name"
                placeholder={t('last_name_placeholder')}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="input input-bordered w-full"
                required
              />
            </Field>
          </div>
        )}

        {step === 'details' && mode === 'phone' && (
          <Field label={t('phone_label')} help={t('phone_help')}>
            <IconInput icon={faPhone}>
              <input
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder={t('phone_placeholder')}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="grow bg-transparent outline-none"
                required
              />
            </IconInput>
          </Field>
        )}

        {step === 'details' && mode === 'email' && (
          <>
            <Field label={t('email_label')}>
              <IconInput icon={faEnvelope}>
                <input
                  type="email"
                  autoComplete="email"
                  placeholder={t('email_placeholder')}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="grow bg-transparent outline-none"
                  required
                />
              </IconInput>
            </Field>
            <Field label={t('password_label')} help={t('password_help')}>
              <input
                type="password"
                autoComplete="new-password"
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
              {mode === 'phone'
                ? t('verify_phone_subtitle', { target: identifier })
                : t('verify_email_subtitle', { target: identifier })}
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

        <div id="clerk-captcha" />
      </form>

      {step === 'details' && (
        <div className="border-base-300 mt-5 flex flex-wrap items-center justify-between gap-3 border-t pt-4 text-sm">
          <button
            type="button"
            onClick={() => {
              setMode((m) => (m === 'phone' ? 'email' : 'phone'));
              setError(null);
              setIdentifier('');
              setPassword('');
            }}
            className="text-primary text-xs font-semibold hover:underline"
          >
            {mode === 'phone' ? tShared('use_email') : tShared('use_phone')}
          </button>
          <Link
            href={`/${locale}/sign-in` as Route}
            className="text-base-content/65 hover:text-base-content text-xs no-underline"
          >
            <span>{t('have_account')}</span>{' '}
            <span className="text-primary font-semibold">{t('sign_in_link')}</span>
          </Link>
        </div>
      )}

      <p className="text-base-content/45 mt-4 text-center text-[11px] leading-relaxed">
        {t('terms_prefix')}{' '}
        <Link href={`/${locale}/terms` as Route} className="hover:underline">
          {t('terms_link')}
        </Link>{' '}
        {t('and')}{' '}
        <Link href={`/${locale}/privacy` as Route} className="hover:underline">
          {t('privacy_link')}
        </Link>
        .
      </p>

      <p className="text-base-content/55 mt-3 text-center text-[11px]">
        {t('hire_instead')}{' '}
        <Link
          href={`/${locale}/employer/sign-up` as Route}
          className="text-primary font-semibold no-underline hover:underline"
        >
          {t('employer_link')}
        </Link>
      </p>
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
