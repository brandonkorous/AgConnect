export type ShiftTone = 'primary' | 'ink' | 'accent' | 'ghost';

export type DayShift = {
  tone: ShiftTone;
  label: string;
  time: string;
};

export const SHIFTS_BY_DAY: Record<number, DayShift[]> = {
  4: [{ tone: 'primary', label: 'Sunridge · Grape', time: '6 AM' }],
  5: [{ tone: 'primary', label: 'Westside · Almond', time: '5:30 AM' }],
  6: [{ tone: 'primary', label: 'Westside · Almond', time: '5:30 AM' }],
  7: [{ tone: 'accent', label: 'Forklift training', time: '9 AM' }],
  8: [{ tone: 'primary', label: 'Westside · Almond', time: '5:30 AM' }],
  12: [
    { tone: 'ink', label: 'Sunridge · Harvest', time: '6 AM' },
    { tone: 'ghost', label: '+1', time: '' },
  ],
  13: [{ tone: 'ink', label: 'Sunridge · Harvest', time: '6 AM' }],
  14: [{ tone: 'ink', label: 'Sunridge · Harvest', time: '6 AM' }],
  18: [{ tone: 'primary', label: 'Río Verde · Tomato', time: '7 AM' }],
  19: [{ tone: 'primary', label: 'Río Verde · Tomato', time: '7 AM' }],
  25: [{ tone: 'accent', label: 'WPS refresh', time: '10 AM' }],
};

export type UpcomingShift = {
  date: string;
  title: string;
  employer: string;
  start: string;
  end: string;
  pay: string;
  loc: string;
  status: 'Confirmed' | 'Awaiting confirm' | 'Enrolled' | 'Pending';
  training?: boolean;
};

export const UPCOMING: UpcomingShift[] = [
  {
    date: 'Mon · Aug 4',
    title: 'Grape Harvest',
    employer: 'Sunridge Vineyards',
    start: '6:00 AM',
    end: '2:30 PM',
    pay: '$22.50/hr',
    loc: 'Madera, CA',
    status: 'Confirmed',
  },
  {
    date: 'Tue · Aug 5',
    title: 'Almond Shaking',
    employer: 'Westside Orchards',
    start: '5:30 AM',
    end: '1:30 PM',
    pay: '$24.00/hr',
    loc: 'Modesto, CA',
    status: 'Awaiting confirm',
  },
  {
    date: 'Thu · Aug 7',
    title: 'Forklift Training',
    employer: 'Reedley College',
    start: '9:00 AM',
    end: '4:00 PM',
    pay: 'Stipend $80',
    loc: 'Reedley, CA',
    status: 'Enrolled',
    training: true,
  },
  {
    date: 'Mon · Aug 18',
    title: 'Cannery Tomato Pick',
    employer: 'Río Verde Farms',
    start: '7:00 AM',
    end: '4:00 PM',
    pay: '$20.75/hr',
    loc: 'Yolo Co.',
    status: 'Pending',
  },
];
