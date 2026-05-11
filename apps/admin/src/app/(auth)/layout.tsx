export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="bg-base-200 grid min-h-screen place-items-center px-5 py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <p className="eyebrow text-base-content/60">AgConn</p>
          <h1 className="font-serif text-2xl font-medium tracking-tight">Admin console</h1>
        </div>
        {children}
      </div>
    </main>
  );
}
