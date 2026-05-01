import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <main className="bg-base-200 flex min-h-[calc(100vh-4rem)] items-center justify-center px-6 py-12">
      <SignIn appearance={{ elements: { card: 'shadow-md rounded-2xl' } }} />
    </main>
  );
}
