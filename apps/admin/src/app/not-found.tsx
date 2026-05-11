import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="container mx-auto px-5 py-20 md:px-8 lg:px-20">
      <div className="bg-base-100 border-base-300 mx-auto max-w-md rounded-box border p-8 text-center">
        <p className="eyebrow text-base-content/60">404</p>
        <h1 className="font-serif text-2xl font-medium">Page not found.</h1>
        <p className="text-base-content/70 mt-2 text-sm">
          The path you requested isn&rsquo;t part of the admin console.
        </p>
        <Link href="/" className="btn btn-primary btn-sm mt-6 rounded-full">
          Back to admin home
        </Link>
      </div>
    </main>
  );
}
