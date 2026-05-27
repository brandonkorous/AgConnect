'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { useLocale, useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBriefcase,
  faUsers,
  faCoins,
  faShield,
  faChartLine,
  faEnvelope,
  faPhone,
  faBookOpen,
} from '@fortawesome/free-solid-svg-icons';

const TOPICS = [
  { icon: faBriefcase, slug: 'posting-a-job', titleKey: 'topic.post_job.title', bodyKey: 'topic.post_job.body' },
  { icon: faUsers, slug: 'review-applicants', titleKey: 'topic.review_applicants.title', bodyKey: 'topic.review_applicants.body' },
  { icon: faCoins, slug: 'payroll', titleKey: 'topic.payroll.title', bodyKey: 'topic.payroll.body' },
  { icon: faShield, slug: 'compliance', titleKey: 'topic.compliance.title', bodyKey: 'topic.compliance.body' },
  { icon: faChartLine, slug: 'reports', titleKey: 'topic.reports.title', bodyKey: 'topic.reports.body' },
  { icon: faBookOpen, slug: 'company-profile', titleKey: 'topic.profile.title', bodyKey: 'topic.profile.body' },
] as const;

export function HelpClient() {
  const locale = useLocale();
  const t = useTranslations('employer.help');

  return (
    <div className=" px-5 pb-16 pt-8">
      <div className="mb-7 max-w-3xl">
        <p className="text-base-content/60 font-mono text-xs uppercase tracking-wider">
          {t('eyebrow')}
        </p>
        <h1 className="font-display mt-2 text-4xl font-light leading-tight tracking-tight md:text-5xl">
          {t('title_a')} <em className="text-primary not-italic font-light">{t('title_b')}</em>
        </h1>
        <p className="text-base-content/70 mt-3 text-base">{t('subtitle')}</p>
      </div>

      <section aria-labelledby="topics-heading" className="mb-8">
        <h2
          id="topics-heading"
          className="text-base-content/60 mb-4 font-mono text-xs font-semibold uppercase tracking-wider"
        >
          {t('topics_heading')}
        </h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {TOPICS.map((topic) => (
            <Link
              key={topic.titleKey}
              href={`/${locale}/help/${topic.slug}` as Route}
              className="bg-base-100 border-base-300 hover:border-primary/40 group rounded-2xl border p-5 transition"
            >
              <div className="bg-primary/10 text-primary mb-3 grid h-9 w-9 place-items-center rounded-xl">
                <FontAwesomeIcon icon={topic.icon} className="h-4 w-4" />
              </div>
              <h3 className="font-display text-lg font-light tracking-tight">{t(topic.titleKey)}</h3>
              <p className="text-base-content/70 mt-1 text-sm">{t(topic.bodyKey)}</p>
            </Link>
          ))}
        </div>
      </section>

      <section
        aria-labelledby="contact-heading"
        className="bg-base-100 border-base-300 grid grid-cols-1 gap-6 rounded-2xl border p-7 md:grid-cols-[1fr_auto] md:items-center"
      >
        <div>
          <h2 id="contact-heading" className="font-display text-2xl font-light tracking-tight">
            {t('contact_title')}
          </h2>
          <p className="text-base-content/70 mt-2 text-sm">{t('contact_body')}</p>
          <p className="text-base-content/55 mt-2 font-mono text-xs">{t('contact_hours')}</p>
        </div>
        <div className="flex flex-col gap-2">
          <a
            href="mailto:support@agconn.com"
            className="btn btn-ghost btn-sm border-base-300 rounded-full border"
          >
            <FontAwesomeIcon icon={faEnvelope} className="h-3.5 w-3.5" />
            support@agconn.com
          </a>
          <a
            href="tel:+15598675309"
            className="btn btn-ghost btn-sm border-base-300 rounded-full border"
          >
            <FontAwesomeIcon icon={faPhone} className="h-3.5 w-3.5" />
            (559) 867-5309
          </a>
        </div>
      </section>
    </div>
  );
}
