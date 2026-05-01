import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMagnifyingGlass,
  faPhone,
  faComments,
  faUsers,
  faShieldHalved,
  faIdBadge,
  faBolt,
  faThumbtack,
} from '@fortawesome/free-solid-svg-icons';
import {
  listThreads,
  listMessages,
  type MessageThreadView,
  type MessageView,
  type FolderKey,
  type FolderCounts,
} from '@/lib/api/employer-ops';
import { MessageComposer } from '@/components/employer/messages/MessageComposer';
import { NewConversationButton } from '@/components/employer/messages/NewConversationButton';

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ folder?: string; thread?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'employer.messages' });
  return { title: `AgConn — ${t('title')}` };
}

const VALID_FOLDERS: ReadonlyArray<FolderKey> = [
  'all',
  'candidates',
  'crew',
  'foremen',
  'broadcasts',
];

export default async function MessagesPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const sp = await searchParams;
  const folder: FolderKey =
    sp.folder && (VALID_FOLDERS as ReadonlyArray<string>).includes(sp.folder)
      ? (sp.folder as FolderKey)
      : 'all';
  const t = await getTranslations({ locale, namespace: 'employer.messages' });

  const { threads, counts } = await listThreads(folder);
  const requestedThread = sp.thread ? threads.find((th) => th.id === sp.thread) : null;
  const activeThread = requestedThread ?? threads[0] ?? null;
  const messages = activeThread ? await listMessages(activeThread.id) : ([] as MessageView[]);
  const unread = counts.all > 0 ? threads.reduce((sum, t) => sum + t.unread, 0) : 0;

  return (
    <div className="px-8 pb-16 pt-8">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-base-content/60 font-mono text-[11px] uppercase tracking-wider">
            {t('eyebrow')}
          </p>
          <h1 className="font-display mt-2 text-4xl font-light leading-tight tracking-tight md:text-5xl">
            {t('title_a')}{' '}
            <em className="text-primary not-italic font-light">
              {t('title_b', { unread })}
            </em>
          </h1>
          <div className="text-base-content/70 mt-2 text-sm">{t('summary')}</div>
        </div>
        <div className="flex gap-2">
          <NewConversationButton variant="thread" />
          <NewConversationButton variant="broadcast" />
        </div>
      </div>

      <div className="bg-base-100 border-base-300 grid h-[720px] grid-cols-[220px_340px_1fr] overflow-hidden rounded-2xl border">
        <FoldersColumn locale={locale} folder={folder} counts={counts} t={t} />
        <ThreadList
          threads={threads}
          activeId={activeThread?.id ?? null}
          locale={locale}
          folder={folder}
          t={t}
        />
        <Conversation thread={activeThread} messages={messages} t={t} />
      </div>
    </div>
  );
}

function FoldersColumn({
  locale,
  folder,
  counts,
  t,
}: {
  locale: string;
  folder: FolderKey;
  counts: FolderCounts;
  t: Awaited<ReturnType<typeof getTranslations>>;
}) {
  const folders: Array<{
    key: FolderKey;
    icon: typeof faComments;
    dot?: boolean;
  }> = [
    { key: 'all',         icon: faComments },
    { key: 'candidates',  icon: faUsers },
    { key: 'crew',        icon: faIdBadge, dot: true },
    { key: 'foremen',     icon: faShieldHalved },
    { key: 'broadcasts',  icon: faBolt },
  ];

  return (
    <div className="bg-base-200 border-base-300 border-r p-3">
      {folders.map((f) => {
        const active = f.key === folder;
        const count = counts[f.key];
        return (
          <Link
            key={f.key}
            href={`/${locale}/employer/messages?folder=${f.key}`}
            className={[
              'mb-1 flex items-center gap-2.5 rounded-lg border px-2.5 py-2 transition-colors',
              active
                ? 'bg-base-100 border-base-300 font-semibold'
                : 'border-transparent hover:bg-base-100/50 font-medium',
            ].join(' ')}
          >
            <FontAwesomeIcon
              icon={f.icon}
              className={[
                'h-3.5 w-3.5',
                active ? 'text-primary' : 'text-base-content/70',
              ].join(' ')}
            />
            <span className="flex-1 text-xs">{t(`folders.${f.key}`)}</span>
            {count > 0 && (
              <span
                className={[
                  'rounded-full px-1.5 py-0.5 font-mono text-[10px] font-bold',
                  f.dot && f.key === 'crew'
                    ? 'bg-accent text-accent-content'
                    : 'bg-base-100 text-base-content/60',
                ].join(' ')}
              >
                {count}
              </span>
            )}
          </Link>
        );
      })}
      <div className="border-base-300 mt-4 border-t pt-3">
        <div className="text-base-content/60 mb-2 font-mono text-[10px] font-bold uppercase tracking-wider">
          {t('templates_label')}
        </div>
        <p className="text-base-content/50 text-[10px] leading-relaxed">
          {t('templates_help')}
        </p>
      </div>
    </div>
  );
}

function ThreadList({
  threads,
  activeId,
  locale,
  folder,
  t,
}: {
  threads: MessageThreadView[];
  activeId: string | null;
  locale: string;
  folder: FolderKey;
  t: Awaited<ReturnType<typeof getTranslations>>;
}) {
  return (
    <div className="border-base-300 overflow-y-auto border-r">
      <div className="border-base-300 border-b p-3">
        <div className="bg-base-200 text-base-content/60 flex items-center gap-2 rounded-full px-3 py-2 text-xs">
          <FontAwesomeIcon icon={faMagnifyingGlass} className="h-3 w-3" />
          {t('search_placeholder')}
        </div>
      </div>
      {threads.length === 0 && (
        <div className="text-base-content/60 p-6 text-center text-xs">
          {t('empty')}
        </div>
      )}
      {threads.map((th) => {
        const isActive = th.id === activeId;
        const ch = channelClass(th.channel);
        return (
          <Link
            key={th.id}
            href={`/${locale}/employer/messages?folder=${folder}&thread=${th.id}`}
            className={[
              'border-base-300 flex cursor-pointer items-start gap-2.5 border-b p-3.5',
              isActive ? 'bg-primary/10' : 'bg-base-100 hover:bg-base-200',
            ].join(' ')}
          >
            <div
              className={[
                'grid h-9 w-9 shrink-0 place-items-center rounded-full font-mono text-[11px] font-bold',
                th.group ? 'bg-accent text-accent-content' : 'bg-base-content text-base-100',
              ].join(' ')}
            >
              {th.initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <span
                  className={[
                    'truncate text-sm',
                    th.unread ? 'font-bold' : 'font-semibold',
                  ].join(' ')}
                >
                  {th.name}
                </span>
                <span className="text-base-content/60 shrink-0 font-mono text-[10px]">
                  {th.whenLabel}
                </span>
              </div>
              <div className="text-base-content/60 truncate text-[11px]">{th.preview}</div>
              <div className="mt-1.5 flex items-center gap-1.5">
                <span
                  className={[
                    'rounded px-1.5 py-0.5 font-mono text-[9px] font-bold tracking-wider',
                    ch,
                  ].join(' ')}
                >
                  {t(`channel.${th.channel}`)}
                </span>
                {th.unread > 0 && (
                  <span className="bg-primary text-primary-content rounded-full px-1.5 py-0.5 font-mono text-[10px] font-bold">
                    {th.unread}
                  </span>
                )}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function Conversation({
  thread,
  messages,
  t,
}: {
  thread: MessageThreadView | null;
  messages: MessageView[];
  t: Awaited<ReturnType<typeof getTranslations>>;
}) {
  if (!thread) {
    return (
      <div className="text-base-content/60 grid place-items-center text-sm">
        {t('no_thread')}
      </div>
    );
  }
  const initialChannel: 'app' | 'sms' | 'whatsapp' =
    thread.channel === 'broadcast' ? 'app' : thread.channel;
  return (
    <div className="flex flex-col">
      <div className="border-base-300 flex items-center gap-3 border-b px-5 py-3.5">
        <div className="bg-accent text-accent-content grid h-9 w-9 place-items-center rounded-full font-mono text-[11px] font-bold">
          {thread.initials}
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold">{thread.name}</div>
          <div className="text-base-content/60 text-[11px]">
            {thread.group
              ? t('thread_meta_group', { members: thread.participantCount })
              : t('thread_meta_dm', { channel: t(`channel.${thread.channel}`) })}
          </div>
        </div>
        {thread.foremanPhone ? (
          <a
            href={`tel:${thread.foremanPhone}`}
            className="bg-base-100 border-base-300 hover:bg-base-200 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold"
          >
            <FontAwesomeIcon icon={faPhone} className="h-3 w-3" />
            {t('call_foreman')}
          </a>
        ) : null}
      </div>

      <div className="bg-base-200 flex-1 overflow-y-auto p-6">
        {thread.category === 'crew' && (
          <div className="bg-base-content text-base-100 mb-5 rounded-xl p-3.5">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-accent inline-flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider">
                <FontAwesomeIcon icon={faThumbtack} className="h-3 w-3" /> {t('pinned_eyebrow')}
              </span>
            </div>
            <div className="font-display mb-1.5 text-lg font-light tracking-tight">
              {thread.name}
            </div>
            <div className="text-base-100/75 text-xs">{t('pinned_help')}</div>
          </div>
        )}

        {messages.length === 0 && (
          <div className="text-base-content/60 grid place-items-center py-10 text-xs">
            {t('no_messages')}
          </div>
        )}

        {messages.map((m) => (
          <div
            key={m.id}
            className={[
              'mb-3 flex',
              m.senderRole === 'me' ? 'justify-end' : 'justify-start',
            ].join(' ')}
          >
            <div className="max-w-[70%]">
              <div
                className={[
                  'rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
                  m.senderRole === 'me'
                    ? 'bg-primary text-primary-content'
                    : 'bg-base-100 border-base-300 border',
                ].join(' ')}
              >
                {m.body}
              </div>
              <div
                className={[
                  'text-base-content/60 mt-1 font-mono text-[10px]',
                  m.senderRole === 'me' ? 'text-right' : 'text-left',
                ].join(' ')}
              >
                {m.whenLabel}
                {m.senderRole === 'me' ? ' · sent' : ''}
              </div>
            </div>
          </div>
        ))}
      </div>

      <MessageComposer
        conversationId={thread.id}
        initialChannel={initialChannel}
        smsCount={thread.participantCount}
      />
    </div>
  );
}

function channelClass(c: 'app' | 'sms' | 'whatsapp' | 'broadcast'): string {
  switch (c) {
    case 'app':
      return 'bg-primary/15 text-primary';
    case 'sms':
      return 'bg-warning/15 text-warning';
    case 'whatsapp':
      return 'bg-success/15 text-success';
    case 'broadcast':
      return 'bg-accent text-accent-content';
  }
}
