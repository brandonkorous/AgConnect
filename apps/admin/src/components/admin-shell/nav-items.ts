import {
  faShieldHalved,
  faLanguage,
  faChartLine,
  faBuilding,
  faBriefcase,
  faPeopleGroup,
  faFileSignature,
  faGraduationCap,
  faClipboardCheck,
  faComments,
  faEnvelope,
  faMobileScreen,
  faCoins,
  faGears,
  faHouse,
  faUserTie,
} from '@fortawesome/free-solid-svg-icons';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';

export type NavScope = 'platform' | 'tenant';

export type NavItem = {
  href: string;
  label: string;
  icon: IconDefinition;
  scope: NavScope | 'both';
};

// All routes are relative to the active scope:
//   platform → /<path>
//   tenant   → /t/<tenantId>/<path>
// The shell prepends the prefix at render time.
export const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Overview', icon: faHouse, scope: 'both' },
  { href: '/translations', label: 'Translations', icon: faLanguage, scope: 'platform' },
  { href: '/audit', label: 'Audit log', icon: faShieldHalved, scope: 'both' },
  { href: '/reports', label: 'Reports', icon: faChartLine, scope: 'both' },
  { href: '/training', label: 'Training', icon: faGraduationCap, scope: 'both' },
  { href: '/tenants', label: 'Tenants', icon: faBuilding, scope: 'platform' },
  { href: '/employers', label: 'Employers', icon: faUserTie, scope: 'both' },
  { href: '/workers', label: 'Workers', icon: faPeopleGroup, scope: 'platform' },
  { href: '/users', label: 'Users', icon: faPeopleGroup, scope: 'platform' },
  { href: '/jobs', label: 'Jobs', icon: faBriefcase, scope: 'both' },
  { href: '/applications', label: 'Applications', icon: faFileSignature, scope: 'both' },
  { href: '/enrollments', label: 'Enrollments', icon: faGraduationCap, scope: 'both' },
  { href: '/compliance', label: 'Compliance', icon: faClipboardCheck, scope: 'both' },
  { href: '/messaging', label: 'Messaging', icon: faComments, scope: 'both' },
  { href: '/sms', label: 'SMS', icon: faMobileScreen, scope: 'both' },
  { href: '/email', label: 'Email', icon: faEnvelope, scope: 'both' },
  { href: '/billing', label: 'Billing', icon: faCoins, scope: 'both' },
  { href: '/waitlist', label: 'Waitlist', icon: faClipboardCheck, scope: 'platform' },
  { href: '/system', label: 'System', icon: faGears, scope: 'platform' },
];
