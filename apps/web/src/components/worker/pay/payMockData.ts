export type PayWeek = {
  period: string;
  hours: number;
  gross: number;
  net: number;
  status: 'Pending' | 'Paid';
  employer: string;
};

export const WEEKS: PayWeek[] = [
  { period: 'Jul 28 – Aug 3', hours: 49.5, gross: 1124.5, net: 982.16, status: 'Pending', employer: 'Sunridge Vineyards' },
  { period: 'Jul 21 – 27', hours: 52.0, gross: 1248.0, net: 1086.4, status: 'Paid', employer: 'Westside Orchards' },
  { period: 'Jul 14 – 20', hours: 47.5, gross: 1140.0, net: 996.84, status: 'Paid', employer: 'Westside Orchards' },
  { period: 'Jul 7 – 13', hours: 51.0, gross: 1147.5, net: 1003.41, status: 'Paid', employer: 'Río Verde Farms' },
  { period: 'Jun 30 – Jul 6', hours: 44.0, gross: 990.0, net: 866.25, status: 'Paid', employer: 'Río Verde Farms' },
];

export const MONTHS: [string, number][] = [
  ['Sep', 2.1],
  ['Oct', 2.8],
  ['Nov', 1.4],
  ['Dec', 0.9],
  ['Jan', 1.2],
  ['Feb', 1.6],
  ['Mar', 2.4],
  ['Apr', 3.1],
  ['May', 3.8],
  ['Jun', 4.2],
  ['Jul', 4.6],
  ['Aug', 1.1],
];
