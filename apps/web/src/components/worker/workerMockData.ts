export type Badge = 'verified' | 'hiring_fast' | 'top_employer';

export type JobMock = {
    id: string;
    title: string;
    employer: string;
    county: string;
    pay: string;
    payNote: string;
    start: string;
    spots: number;
    badge: Badge;
    housing: boolean;
};

export const RECOMMENDED_JOBS: JobMock[] = [
    {
        id: 'almond-shaking',
        title: 'Almond Shaking Crew',
        employer: 'Westside Orchards Co-op',
        county: 'Stanislaus County',
        pay: '$24.00/hr',
        payNote: 'guaranteed 50 hr/wk',
        start: 'Aug 5',
        spots: 6,
        badge: 'top_employer',
        housing: false,
    },
    {
        id: 'tomato-pick',
        title: 'Cannery Tomato Pick',
        employer: 'Río Verde Farms',
        county: 'Yolo County',
        pay: '$20.75/hr',
        payNote: '+ overtime',
        start: 'Aug 18',
        spots: 22,
        badge: 'verified',
        housing: true,
    },
    {
        id: 'orange-pruning',
        title: 'Navel Orange Pruning',
        employer: 'Tulare Valley Citrus',
        county: 'Tulare County',
        pay: '$21.50/hr',
        payNote: 'weekly pay',
        start: 'Sep 2',
        spots: 9,
        badge: 'hiring_fast',
        housing: false,
    },
    {
        id: 'berry-pack',
        title: 'Strawberry Pack House',
        employer: 'Coastal Berry LLC',
        county: 'Monterey County',
        pay: '$23.00/hr',
        payNote: 'shift bonus',
        start: 'Aug 9',
        spots: 18,
        badge: 'verified',
        housing: true,
    },
];

export type StageKey = 'accepted' | 'interview' | 'reviewed' | 'applied';

export type ApplicationMock = {
    id: string;
    title: string;
    employer: string;
    date: string;
    pay: string;
    stage: StageKey;
};

export const APPLICATIONS: ApplicationMock[] = [
    {
        id: 'grape-harvest',
        title: 'Grape Harvest',
        employer: 'Sunridge Vineyards',
        date: 'Aug 12',
        pay: '$22.50',
        stage: 'accepted',
    },
    {
        id: 'almond-shaking',
        title: 'Almond Shaking',
        employer: 'Westside Orchards',
        date: 'Aug 5',
        pay: '$24.00',
        stage: 'interview',
    },
    {
        id: 'tomato-pick',
        title: 'Tomato Pick',
        employer: 'Río Verde Farms',
        date: 'Aug 18',
        pay: '$20.75',
        stage: 'reviewed',
    },
    {
        id: 'orange-pruning',
        title: 'Orange Pruning',
        employer: 'Tulare Valley Citrus',
        date: 'Sep 2',
        pay: '$21.50',
        stage: 'applied',
    },
    {
        id: 'berry-pack',
        title: 'Berry Pack',
        employer: 'Coastal Berry',
        date: 'Aug 9',
        pay: '$23.00',
        stage: 'applied',
    },
];

export type ChannelKey = 'whatsapp' | 'sms' | 'in_app';

export type MessageMock = {
    id: string;
    from: string;
    body: string;
    time: string;
    channel: ChannelKey;
};

export const MESSAGES: MessageMock[] = [
    {
        id: 'sunridge',
        from: 'Sunridge Vineyards',
        body: 'See you tomorrow at 6 AM. Bring water — it will be hot.',
        time: '2h',
        channel: 'whatsapp',
    },
    {
        id: 'agconn-cert',
        from: 'AgConn',
        body: 'Your Forklift cert seat opens next Mon. Reply YES to claim.',
        time: '5h',
        channel: 'sms',
    },
    {
        id: 'westside',
        from: 'Westside Orchards',
        body: 'Interview scheduled for Thu 9 AM at the Modesto office.',
        time: '1d',
        channel: 'in_app',
    },
];

export const AVAILABILITY: ReadonlyArray<{ date: string; open: boolean }> = [
    { date: 'Aug 4', open: true },
    { date: 'Aug 5', open: true },
    { date: 'Aug 6', open: true },
    { date: 'Aug 7', open: true },
    { date: 'Aug 8', open: true },
    { date: 'Aug 9', open: false },
    { date: 'Aug 10', open: false },
];
