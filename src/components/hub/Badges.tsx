import { cn } from "@/lib/utils";

const LEVEL_STYLES: Record<string, string> = {
  BRONZE: "bg-[oklch(0.95_0.03_55)] text-[oklch(0.45_0.09_55)]",
  SILVER: "bg-[oklch(0.94_0.008_250)] text-[oklch(0.42_0.02_250)]",
  GOLD: "bg-[oklch(0.95_0.06_85)] text-[oklch(0.48_0.1_85)]",
};

export function LevelBadge({ code, className }: { code?: string | null; className?: string }) {
  const key = (code ?? "BRONZE").toUpperCase();
  const label = key.charAt(0) + key.slice(1).toLowerCase();
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold tracking-wide",
        LEVEL_STYLES[key] ?? LEVEL_STYLES["SILVER"],
        className,
      )}
    >
      {label}
    </span>
  );
}

const STATUS_STYLES: Record<string, string> = {
  neutral: "bg-muted text-muted-foreground",
  info: "bg-[oklch(0.95_0.03_250)] text-[oklch(0.45_0.12_250)]",
  success: "bg-[oklch(0.95_0.05_155)] text-[oklch(0.42_0.12_155)]",
  warning: "bg-[oklch(0.96_0.06_78)] text-[oklch(0.45_0.1_78)]",
  danger: "bg-[oklch(0.95_0.04_25)] text-[oklch(0.48_0.16_25)]",
};

export function StatusBadge({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: keyof typeof STATUS_STYLES;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
        STATUS_STYLES[tone],
      )}
    >
      {label}
    </span>
  );
}

export function quoteTone(status: string) {
  if (["approved", "confirmed"].includes(status)) return "success" as const;
  if (["pending", "in_review"].includes(status)) return "warning" as const;
  if (["rejected", "cancelled"].includes(status)) return "danger" as const;
  return "neutral" as const;
}

export function orderTone(status: string) {
  if (["delivered", "approved", "availability_confirmed"].includes(status)) return "success" as const;
  if (["rejected", "cancelled"].includes(status)) return "danger" as const;
  if (["shipped", "preparing"].includes(status)) return "info" as const;
  return "warning" as const;
}
