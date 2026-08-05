import { HubShell } from "@/components/hub/HubShell";
import { useMe } from "@/hooks/useMe";
import { Construction } from "lucide-react";

export function ComingSoon({
  title,
  phase,
  description,
}: {
  title: string;
  phase: string;
  description: string;
}) {
  const { data: me } = useMe();
  return (
    <HubShell
      isAdmin={me?.roles.includes("admin") ?? false}
      title={title}
      subtitle="TÖHÖ HUB"
    >
      <div className="hub-card mx-auto max-w-xl p-10 text-center">
        <Construction className="mx-auto h-7 w-7 text-primary" />
        <h2 className="mt-4 font-display text-xl font-semibold">{title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
        <p className="hub-eyebrow mt-6">{phase}</p>
      </div>
    </HubShell>
  );
}
