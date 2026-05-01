export type Folder = {
  key: 'all' | 'employers' | 'foremen' | 'agconn';
  count: number;
};

export const FOLDERS: Folder[] = [
  { key: 'all', count: 18 },
  { key: 'employers', count: 12 },
  { key: 'foremen', count: 4 },
  { key: 'agconn', count: 2 },
];

export type Channel = 'WhatsApp' | 'In-app' | 'SMS';

export type Thread = {
  id: string;
  from: string;
  who: string;
  last: string;
  when: string;
  channel: Channel;
  unread: boolean;
  active?: boolean;
  initials: string;
  isAgconn?: boolean;
};

export const THREADS: Thread[] = [
  {
    id: 't1',
    from: 'Sunridge Vineyards',
    who: 'Marisol Vargas, Foreman',
    last: 'See you tomorrow at 6 AM. Bring water — it will be hot. Pickup at the Hwy 99 / Cleveland lot.',
    when: '2h',
    channel: 'WhatsApp',
    unread: true,
    active: true,
    initials: 'SV',
  },
  {
    id: 't2',
    from: 'Westside Orchards',
    who: 'Hiring · Jorge Núñez',
    last: 'Interview confirmed for Thu 9 AM at 2110 Kansas Ave, Modesto. Park in the side lot.',
    when: '5h',
    channel: 'In-app',
    unread: true,
    initials: 'WO',
  },
  {
    id: 't3',
    from: 'AgConn',
    who: 'Training notification',
    last: 'Your Forklift cert seat opens next Mon. Reply YES to claim.',
    when: '5h',
    channel: 'SMS',
    unread: true,
    initials: 'AC',
    isAgconn: true,
  },
  {
    id: 't4',
    from: 'Río Verde Farms',
    who: 'Hiring desk',
    last: "Thanks for applying. Your application is under review — we'll respond within 48 hours.",
    when: '1d',
    channel: 'In-app',
    unread: false,
    initials: 'RV',
  },
  {
    id: 't5',
    from: 'Coastal Berry LLC',
    who: 'Auto-reply',
    last: 'We received your application for Strawberry Pack House. Position fills fast — keep your phone on.',
    when: '2d',
    channel: 'SMS',
    unread: false,
    initials: 'CB',
  },
  {
    id: 't6',
    from: 'AgConn',
    who: 'Wage update',
    last: 'Median pay for grape harvest in Madera County is up 6% this season.',
    when: '3d',
    channel: 'In-app',
    unread: false,
    initials: 'AC',
    isAgconn: true,
  },
  {
    id: 't7',
    from: 'Tulare Valley Citrus',
    who: 'Hiring · A. Aguilar',
    last: 'Application received. We\'ll be in touch when pruning season opens September 2.',
    when: '5d',
    channel: 'SMS',
    unread: false,
    initials: 'TC',
  },
];

export type ChatMessage = {
  from: 'me' | 'them';
  body: string;
  time: string;
  latest?: boolean;
};

export const MESSAGES: ChatMessage[] = [
  { from: 'them', body: '¡Hola Miguel! Welcome to the crew. Tomorrow we start at 6 AM sharp at the Hwy 99 lot.', time: 'Yesterday 4:32 PM' },
  { from: 'them', body: 'Bring sun protection, water (we will refill), gloves, and your boots. The forecast is 98°F.', time: 'Yesterday 4:33 PM' },
  { from: 'me', body: "¡Hola Marisol! Got it — I'll be there 5:45. Pickup at the same lot as last time?", time: 'Yesterday 6:18 PM' },
  { from: 'them', body: 'Yes, same lot. Look for the white Sunridge van. The other pickers are Carlos, Soledad, and Beto.', time: 'Yesterday 6:42 PM' },
  { from: 'them', body: 'See you tomorrow at 6 AM. Bring water — it will be hot. Pickup at the Hwy 99 / Cleveland lot.', time: '2h ago', latest: true },
];

export const CHANNEL_DOT: Record<Channel, string> = {
  WhatsApp: '#22c55e',
  SMS: 'oklch(50% 0.09 120)',
  'In-app': 'oklch(83% 0.13 88)',
};
