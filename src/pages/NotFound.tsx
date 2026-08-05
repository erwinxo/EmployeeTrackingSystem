import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <h1 className="text-6xl font-bold tracking-tight text-primary">404</h1>
      <h2 className="mt-4 text-2xl font-bold tracking-tight">Page Not Found</h2>
      <p className="mt-2 text-sm text-muted-foreground max-w-md">
        The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
      </p>
      <Link
        to="/dashboard"
        className="mt-6 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all"
      >
        Return to Dashboard
      </Link>
    </div>
  )
}
