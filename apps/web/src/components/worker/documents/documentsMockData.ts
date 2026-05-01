import {
  faIdBadge,
  faShieldHalved,
  faCircleCheck,
  faLeaf,
  faUsers,
  faMoneyBill1,
  faSun,
  type IconDefinition,
} from '@fortawesome/free-solid-svg-icons';

export type DocStatus = 'Verified' | 'Current' | 'Expiring soon' | 'Missing';

export type DocItem = {
  name: string;
  meta: string;
  status: DocStatus;
  icon: IconDefinition;
};

export type DocGroup = {
  key: 'identification' | 'work' | 'certs';
  items: DocItem[];
};

export const GROUPS: DocGroup[] = [
  {
    key: 'identification',
    items: [
      { name: 'CA Driver License', meta: 'D1234567 · Exp Mar 2028', status: 'Verified', icon: faIdBadge },
      { name: 'Social Security Card', meta: 'On file · Encrypted', status: 'Verified', icon: faShieldHalved },
      { name: 'I-9 Employment Eligibility', meta: 'Form completed Apr 2025', status: 'Verified', icon: faCircleCheck },
    ],
  },
  {
    key: 'work',
    items: [
      { name: 'Résumé', meta: 'Updated Jul 14, 2026', status: 'Current', icon: faLeaf },
      { name: 'References (3)', meta: 'M. Vargas · J. Núñez · R. Aguilar', status: 'Current', icon: faUsers },
      { name: 'Direct deposit voided check', meta: 'BOA ••3471', status: 'Current', icon: faMoneyBill1 },
    ],
  },
  {
    key: 'certs',
    items: [
      { name: 'Heat Illness Prevention', meta: 'AC-HIP-2402 · Mar 2026', status: 'Verified', icon: faSun },
      { name: 'FSMA Produce Safety', meta: 'AC-FSMA-2401 · Jan 2026', status: 'Verified', icon: faShieldHalved },
      { name: 'AB 1825 Harassment Prev.', meta: 'AC-SHP-2511 · Nov 2025', status: 'Expiring soon', icon: faIdBadge },
    ],
  },
];

export const COMPLETENESS_TASKS = [
  { key: 'identity', done: true },
  { key: 'banking', done: true },
  { key: 'references', done: true },
  { key: 'photo', done: false },
] as const;

export type ShareEntry = {
  who: string;
  what: string;
  when: string;
  status: 'Active' | 'Revoked';
};

export const SHARES: ShareEntry[] = [
  { who: 'Sunridge Vineyards', what: 'I-9, References', when: 'Jul 28, 2026 · 2:14 PM', status: 'Active' },
  { who: 'Westside Orchards', what: 'I-9, FSMA cert', when: 'Jul 24, 2026 · 9:02 AM', status: 'Active' },
  { who: 'Río Verde Farms', what: 'Direct deposit', when: 'Jul 11, 2026 · 11:30 AM', status: 'Revoked' },
];
