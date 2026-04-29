export type FeaturedProgram = {
  id: string;
  titleKey: string;
  orgKey: string;
  funderKey: string;
  hours: number;
  startDate: string;
  capacity: number;
  spotsLeft: number;
  isFree: true;
};

export const featuredPrograms: FeaturedProgram[] = [
  {
    id: 'pesticidas-fresno',
    titleKey: 'programs.pesticidas.title',
    orgKey: 'programs.pesticidas.org',
    funderKey: 'programs.pesticidas.funder',
    hours: 16,
    startDate: 'May 6',
    capacity: 20,
    spotsLeft: 7,
    isFree: true,
  },
  {
    id: 'irrigation-mendota',
    titleKey: 'programs.irrigation.title',
    orgKey: 'programs.irrigation.org',
    funderKey: 'programs.irrigation.funder',
    hours: 24,
    startDate: 'May 14',
    capacity: 16,
    spotsLeft: 4,
    isFree: true,
  },
  {
    id: 'tractor-reedley',
    titleKey: 'programs.tractor.title',
    orgKey: 'programs.tractor.org',
    funderKey: 'programs.tractor.funder',
    hours: 32,
    startDate: 'Jun 2',
    capacity: 12,
    spotsLeft: 9,
    isFree: true,
  },
  {
    id: 'first-aid-madera',
    titleKey: 'programs.first_aid.title',
    orgKey: 'programs.first_aid.org',
    funderKey: 'programs.first_aid.funder',
    hours: 8,
    startDate: 'May 9',
    capacity: 30,
    spotsLeft: 18,
    isFree: true,
  },
];
