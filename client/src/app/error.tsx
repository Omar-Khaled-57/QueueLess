"use client";

export default function Error({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground px-6">
      <h1 className="text-6xl font-black text-primary mb-4">Oops!</h1>
      <h2 className="text-2xl font-bold mb-2">Something went wrong</h2>
      <p className="text-accent/50 dark:text-white/40 mb-8 text-center max-w-md">
        An unexpected error occurred. Please try again.
      </p>
      <button
        onClick={reset}
        className="px-6 py-3 bg-primary text-white rounded-full font-bold hover:opacity-90 transition-opacity"
      >
        Try Again
      </button>
    </div>
  );
}
