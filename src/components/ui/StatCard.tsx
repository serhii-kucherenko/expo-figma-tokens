import { Card } from "./Card";
import { Text } from "./Text";

const tones = { primary: "text-primary", success: "text-success", warning: "text-warning" } as const;

export function StatCard({
  value,
  label,
  tone,
}: {
  value: string;
  label: string;
  tone: keyof typeof tones;
}) {
  return (
    <Card className="flex-1 items-center gap-4 py-16">
      <Text variant="stat" className={tones[tone]}>
        {value}
      </Text>
      <Text variant="statLabel">{label}</Text>
    </Card>
  );
}
