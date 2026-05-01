import {
  faShieldHalved,
  faTruckField,
  faSun,
  faLeaf,
  type IconDefinition,
} from '@fortawesome/free-solid-svg-icons';

export type Recommended = {
  title: string;
  hours: number;
  fund: 'CDFA' | 'F3';
  payBoost: string;
  icon: IconDefinition;
};

export const RECOMMENDED: Recommended[] = [
  { title: 'Pesticide Handler (WPS)', hours: 12, fund: 'CDFA', payBoost: '+$1.75/hr', icon: faShieldHalved },
  { title: 'Tractor & Equipment Operator', hours: 24, fund: 'F3', payBoost: '+$3.00/hr', icon: faTruckField },
  { title: 'Heat Illness Prevention Lead', hours: 6, fund: 'CDFA', payBoost: 'Crew lead path', icon: faSun },
  { title: 'Irrigation & Pump Tech', hours: 18, fund: 'F3', payBoost: '+$2.25/hr', icon: faLeaf },
];

export type CompletedCert = {
  title: string;
  date: string;
  hours: number;
  cert: string;
};

export const COMPLETED: CompletedCert[] = [
  { title: 'Heat Illness Prevention (entry)', date: 'Mar 2026', hours: 4, cert: 'AC-HIP-2402' },
  { title: 'Food Safety Modernization Act', date: 'Jan 2026', hours: 8, cert: 'AC-FSMA-2401' },
  { title: 'Sexual Harassment Prevention (AB 1825)', date: 'Nov 2025', hours: 2, cert: 'AC-SHP-2511' },
];

export const IN_PROGRESS = {
  title: 'Forklift Operator Certification',
  provider: 'Reedley College',
  funder: 'CDFA-funded',
  progress: 38,
  sessionsDone: 4,
  sessionsTotal: 12,
  next: 'Tue Aug 7 · 9 AM',
};
