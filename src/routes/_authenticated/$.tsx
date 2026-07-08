import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/$')({
  component: PlaceholderPage,
})

function PlaceholderPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 py-24">
      <h1 className="text-2xl font-bold tracking-tight">Coming Soon</h1>
      <p className="text-muted-foreground">
        This feature is under development.
      </p>
      <Link
        to="/"
        className="text-sm text-primary underline underline-offset-4"
      >
        Go to Dashboard
      </Link>
    </div>
  )
}
