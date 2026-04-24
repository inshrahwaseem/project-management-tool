export default function ProjectActivityPage() {
  return (
    <div className="flex h-full flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 py-20 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
        <svg className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      </div>
      <h3 className="mt-4 text-lg font-semibold text-foreground">Project Activity</h3>
      <p className="mt-2 text-sm text-muted-foreground">A timeline of all events and changes in this project.</p>
    </div>
  );
}
