import type { ReactNode } from "react";

export function FullPageMessage({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ember px-6">
      <div className="max-w-sm text-center animate-rise">
        {icon && <div className="mx-auto mb-5 grid size-16 place-items-center rounded-2xl bg-card text-primary">{icon}</div>}
        <h1 className="text-3xl font-semibold">{title}</h1>
        {description && <p className="mt-3 text-muted-foreground">{description}</p>}
        {action && <div className="mt-7 flex justify-center gap-3">{action}</div>}
      </div>
    </div>
  );
}

export function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <span className="size-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}
