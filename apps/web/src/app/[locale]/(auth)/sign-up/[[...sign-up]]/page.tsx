import { redirect } from 'next/navigation';

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ role?: string }>;
};

// Legacy /sign-up?role=... URLs route to the new role-specific pages.
// Marketing CTAs have been migrated; this redirect catches bookmarks and
// older copy floating around (emails, prior printed flyers).
export default async function LegacySignUpRedirect({ params, searchParams }: Props) {
  const { locale } = await params;
  const sp = await searchParams;
  if (sp.role === 'employer') redirect(`/${locale}/employer/sign-up`);
  redirect(`/${locale}/worker/sign-up`);
}
