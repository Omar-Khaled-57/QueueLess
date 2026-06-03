import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground px-6">
      <h1 className="text-8xl font-black text-primary mb-4">404</h1>
      <h2 className="text-2xl font-bold mb-2">Page not found</h2>
      <p className="text-accent/50 dark:text-white/40 mb-8 text-center max-w-md">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/"
        className="px-6 py-3 bg-primary text-white rounded-full font-bold hover:opacity-90 transition-opacity"
      >
        Go Home
      </Link>
    </div>
  );
}
