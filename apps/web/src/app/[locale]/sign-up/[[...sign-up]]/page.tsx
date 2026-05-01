import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <main className="bg-base-200 flex min-h-[calc(100vh-4rem)] items-center justify-center px-6 py-12">
      <SignUp appearance={{ elements: { card: 'shadow-md rounded-2xl' } }} />
    </main>
  );
}
