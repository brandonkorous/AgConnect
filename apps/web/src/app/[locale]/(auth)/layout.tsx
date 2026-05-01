// Passthrough — each auth page (sign-in, worker/sign-up, employer/sign-up,
// post-auth, sso-callback) renders its own AuthSplitShell or equivalent.
// Keeping this file present so the (auth) route group exists.
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
