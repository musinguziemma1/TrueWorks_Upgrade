import { type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Inbox } from "lucide-react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 px-4 text-center", className)}>
      <div className="mb-4 text-muted-foreground">{icon || <Inbox className="h-12 w-12" />}</div>
      <h3 className="text-lg font-heading font-bold text-primary mb-2">{title}</h3>
      {description && (
        <p className="text-sm font-body text-foreground/70 max-w-sm mb-6">{description}</p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
}

export { EmptyState };
export type { EmptyStateProps };
