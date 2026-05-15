import { SignIn } from '@clerk/nextjs';

export const metadata = { title: 'Sign in — AGCONN Admin' };
export const dynamic = 'force-dynamic';

export default function SignInPage() {
    return (
        <div className="flex justify-center">
            <SignIn
                routing="path"
                path="/sign-in"
                signUpUrl="/forbidden"
                fallbackRedirectUrl="/"
                appearance={{
                    elements: {
                        footer: 'hidden',
                        socialButtons: 'hidden',
                        dividerRow: 'hidden',
                        formFieldInput: 'rounded',
                        card: 'shadow-[var(--shadow-card)] border border-base-300 rounded-box',
                    },
                }}
            />
        </div>
    );
}
