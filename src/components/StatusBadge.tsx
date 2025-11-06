import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const statusColors = {
    completed:
      "bg-gradient-to-r from-[hsl(142,_76%,_36%)] to-[hsl(142,_76%,_36%,_0.1)] text-[hsl(142,_76%,_96%)]",
    pending:
      "bg-gradient-to-r from-[hsl(48,_96%,_53%)] to-[hsl(48,_96%,_53%,_0.1)] text-[hsl(48,_96%,_93%)]",
    failed:
      "bg-gradient-to-r from-[hsl(var(--destructive))] to-[hsl(var(--destructive)_/_0.1)] text-[hsl(var(--destructive-foreground))]",
    deleted:
      "bg-gradient-to-r from-[hsl(var(--destructive))] to-[hsl(var(--destructive)_/_0.1)] text-[hsl(var(--destructive-foreground))]",
  };

  return (
    <span
      className={cn(
        "px-3 py-1 rounded-full text-sm font-medium shadow-sm border border-[hsl(var(--border))]",
        statusColors[status.toLowerCase() as keyof typeof statusColors] ||
          "bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary)_/_0.1)] text-[hsl(var(--primary-foreground))]",
        className
      )}
    >
      {status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()}
    </span>
  );
}
