import type { useUser } from '@clerk/nextjs';

export type ClerkUser = NonNullable<ReturnType<typeof useUser>['user']>;
export type ClerkEmail = ClerkUser['emailAddresses'][number];
export type ClerkPhone = ClerkUser['phoneNumbers'][number];
export type ClerkExternalAccount = ClerkUser['externalAccounts'][number];
