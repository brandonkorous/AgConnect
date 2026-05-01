export type Stage = 'applied' | 'reviewed' | 'interview' | 'accepted';

export type ActiveApp = {
  stage: Stage;
  crop: string;
  title: string;
  employer: string;
  startDate: string;
  pay: string;
  appliedOn: string;
  spots: number;
  action: 'confirm' | 'interview' | 'note' | 'withdraw';
};

export const ACTIVE: ActiveApp[] = [
  { stage: 'accepted', crop: 'grape', title: 'Grape Harvest', employer: 'Sunridge Vineyards', startDate: 'Aug 12', pay: '$22.50', appliedOn: 'Jul 28', spots: 14, action: 'confirm' },
  { stage: 'interview', crop: 'almond', title: 'Almond Shaking Crew', employer: 'Westside Orchards', startDate: 'Aug 5', pay: '$24.00', appliedOn: 'Jul 26', spots: 6, action: 'interview' },
  { stage: 'reviewed', crop: 'tomato', title: 'Cannery Tomato Pick', employer: 'Río Verde Farms', startDate: 'Aug 18', pay: '$20.75', appliedOn: 'Jul 30', spots: 22, action: 'note' },
  { stage: 'applied', crop: 'citrus', title: 'Navel Orange Pruning', employer: 'Tulare Valley Citrus', startDate: 'Sep 2', pay: '$21.50', appliedOn: 'Aug 1', spots: 9, action: 'withdraw' },
  { stage: 'applied', crop: 'strawberry', title: 'Strawberry Pack House', employer: 'Coastal Berry LLC', startDate: 'Aug 9', pay: '$23.00', appliedOn: 'Jul 31', spots: 18, action: 'withdraw' },
];

export type ArchiveApp = {
  crop: string;
  title: string;
  employer: string;
  date: string;
  result: 'hired' | 'not_selected';
  earned: string | null;
};

export const ARCHIVE: ArchiveApp[] = [
  { crop: 'tomato', title: 'Tomato Sort Line', employer: 'Río Verde Farms', date: 'Jul 14', result: 'hired', earned: '$642.00' },
  { crop: 'almond', title: 'Almond Pickup', employer: 'Westside Orchards', date: 'Jul 02', result: 'hired', earned: '$1,108.50' },
  { crop: 'grape', title: 'Vineyard Setup', employer: 'Estrella Wines', date: 'Jun 22', result: 'not_selected', earned: null },
];

export const PIPELINE: { key: Stage; count: number; color: string }[] = [
  { key: 'applied', count: 2, color: 'oklch(95% 0.01 70)' },
  { key: 'reviewed', count: 1, color: 'oklch(50% 0.09 120 / 0.18)' },
  { key: 'interview', count: 1, color: 'oklch(83% 0.13 88 / 0.4)' },
  { key: 'accepted', count: 1, color: 'oklch(75% 0.18 145 / 0.3)' },
];
