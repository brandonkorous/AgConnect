export type FeaturedJob = {
  id: string;
  titleKey: string;
  employerKey: string;
  countyKey: string;
  wage: string;
  start: string;
  posted: string;
  verified: true;
};

export const featuredJobs: FeaturedJob[] = [
  {
    id: 'fresa-madera',
    titleKey: 'jobs.fresa.title',
    employerKey: 'jobs.fresa.employer',
    countyKey: 'jobs.fresa.county',
    wage: '$18.50–$22.00 / hr',
    start: 'May 12',
    posted: '2 hrs ago',
    verified: true,
  },
  {
    id: 'almendra-kern',
    titleKey: 'jobs.almendra.title',
    employerKey: 'jobs.almendra.employer',
    countyKey: 'jobs.almendra.county',
    wage: '$21.00–$24.00 / hr',
    start: 'Jun 3',
    posted: '5 hrs ago',
    verified: true,
  },
  {
    id: 'uva-fresno',
    titleKey: 'jobs.uva.title',
    employerKey: 'jobs.uva.employer',
    countyKey: 'jobs.uva.county',
    wage: '$17.50–$19.50 / hr',
    start: 'May 20',
    posted: '6 hrs ago',
    verified: true,
  },
  {
    id: 'lechuga-kings',
    titleKey: 'jobs.lechuga.title',
    employerKey: 'jobs.lechuga.employer',
    countyKey: 'jobs.lechuga.county',
    wage: '$16.00–$18.00 / hr',
    start: 'May 18',
    posted: '1 day ago',
    verified: true,
  },
];
