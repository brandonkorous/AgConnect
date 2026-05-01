import { z } from 'zod';

export const MessageChannelEnum = z.enum(['app', 'sms', 'whatsapp', 'broadcast']);
export type MessageChannel = z.infer<typeof MessageChannelEnum>;

export const MessageDirectionEnum = z.enum(['inbound', 'outbound']);
export type MessageDirection = z.infer<typeof MessageDirectionEnum>;

export const CreateConversationBody = z
  .object({
    title: z.string().min(1).max(120),
    isGroup: z.boolean().default(false),
    channel: MessageChannelEnum.default('app'),
    pinnedShiftId: z.string().uuid().optional(),
    participantUserIds: z.array(z.string().min(1)).min(1).max(50),
  })
  .strict();
export type CreateConversationBody = z.infer<typeof CreateConversationBody>;

export const SendMessageBody = z
  .object({
    body: z.string().min(1).max(2000),
    channel: MessageChannelEnum.optional(),
  })
  .strict();
export type SendMessageBody = z.infer<typeof SendMessageBody>;

export const ConversationListQuery = z
  .object({
    folder: z.enum(['all', 'candidates', 'crew', 'foremen', 'broadcasts']).default('all'),
    limit: z.coerce.number().int().min(1).max(100).default(50),
  })
  .strict();
export type ConversationListQuery = z.infer<typeof ConversationListQuery>;

export const ConversationSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  isGroup: z.boolean(),
  channel: MessageChannelEnum,
  pinnedShiftId: z.string().uuid().nullable(),
  lastMessageAt: z.string().nullable(),
  unreadCount: z.number().int().nonnegative(),
  preview: z.string(),
});
export type ConversationView = z.infer<typeof ConversationSchema>;

export const MessageSchema = z.object({
  id: z.string().uuid(),
  conversationId: z.string().uuid(),
  senderUserId: z.string(),
  body: z.string(),
  channel: MessageChannelEnum,
  direction: MessageDirectionEnum,
  createdAt: z.string(),
});
export type MessageView = z.infer<typeof MessageSchema>;
