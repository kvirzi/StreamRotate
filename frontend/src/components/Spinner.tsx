export function Spinner({ className = '' }: { className?: string }) {
  return (
    <svg
      className={`spinner ${className}`}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
}

export function FullPageSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary">
      <div className="text-center">
        <Spinner className="text-accent-orange w-8 h-8 mx-auto" />
        <p className="mt-3 text-text-secondary text-sm">Loading...</p>
      </div>
    </div>
  );
}
