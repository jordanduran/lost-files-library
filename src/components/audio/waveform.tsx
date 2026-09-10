import { cn } from "@/lib/utils";
export function Waveform({
  active = false,
  className,
}: {
  active?: boolean;
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={cn("waveform", active && "waveform-active", className)}
    >
      {Array.from({ length: 48 }, (_, i) => (
        <i
          key={i}
          style={{
            height: `${18 + ((i * 17 + i * i * 7) % 77)}%`,
            animationDelay: `${(i % 9) * 0.1}s`,
          }}
        />
      ))}
    </div>
  );
}
