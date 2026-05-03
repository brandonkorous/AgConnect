'use client';

import { useTranslations, useLocale } from 'next-intl';
import {
  ToastProvider,
  ModalProvider,
  ConsentProvider,
  ConsentBanner,
  OfflineBanner,
  InstallPrompt,
  ServiceWorkerProvider,
  pushToast,
  type ConsentBannerCopy,
} from '@agconn/ui';
import { ApiProvider } from '@agconn/api-client/react';
import { Analytics } from './Analytics';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001';

export function AppShellProviders({
  children,
  enablePwa,
}: {
  children: React.ReactNode;
  enablePwa: boolean;
}) {
  const t = useTranslations('shell');
  const locale = useLocale() as 'en' | 'es';

  const consentCopy: ConsentBannerCopy = {
    title: t('consent.title'),
    body: t('consent.body'),
    acceptAll: t('consent.accept_all'),
    rejectNonEssential: t('consent.reject_non_essential'),
    customize: t('consent.customize'),
    back: t('consent.back'),
    save: t('consent.save'),
    privacyLinkLabel: t('consent.privacy_link'),
    privacyLinkHref: `/${locale}/privacy`,
    category: {
      essential: {
        label: t('consent.category.essential.label'),
        description: t('consent.category.essential.description'),
      },
      functional: {
        label: t('consent.category.functional.label'),
        description: t('consent.category.functional.description'),
      },
      analytics: {
        label: t('consent.category.analytics.label'),
        description: t('consent.category.analytics.description'),
      },
      marketing: {
        label: t('consent.category.marketing.label'),
        description: t('consent.category.marketing.description'),
      },
    },
  };

  return (
    <ConsentProvider>
      <ToastProvider>
        <ModalProvider
          defaults={{
            confirmLabel: t('modal.confirm'),
            cancelLabel: t('modal.cancel'),
          }}
        >
          <ApiProvider
            baseUrl={API_BASE_URL}
            getLocale={() => locale}
            onUnhandledError={(e) => {
              const variant =
                e.toast === false || e.toast === undefined ? 'error' : e.toast;
              pushToast({
                variant,
                title: e.message || t(`error.${e.code}.title`, { default: e.message }),
                dedupeKey: e.code === 'offline' ? 'offline' : undefined,
              });
            }}
          >
            <Analytics>
              <OfflineBanner message={t('offline.banner')} />
              {children}
              <ConsentBanner copy={consentCopy} />
              {enablePwa && (
                <>
                  <InstallPrompt
                    copy={{
                      title: t('install.title'),
                      body: t('install.body'),
                      cta: t('install.cta'),
                      later: t('install.later'),
                    }}
                  />
                  <ServiceWorkerProvider
                    scriptUrl="/sw.js"
                    copy={{
                      updateTitle: t('update.title'),
                      updateDescription: t('update.description'),
                      updateCta: t('update.cta'),
                    }}
                  />
                </>
              )}
            </Analytics>
          </ApiProvider>
        </ModalProvider>
      </ToastProvider>
    </ConsentProvider>
  );
}
