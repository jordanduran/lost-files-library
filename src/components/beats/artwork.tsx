import { cn } from "@/lib/utils";
export function Artwork({
  kind,
  className,
  title,
}: {
  kind: string;
  className?: string;
  title?: string;
}) {
  return (
    <div
      role="img"
      aria-label={
        title
          ? `Abstract cover art for ${title}`
          : "Abstract sculptural artwork"
      }
      className={cn("artwork", `art-${kind}`, className)}
    >
      <div className="art-object" />
      <div className="art-grain" />
      <span className="art-mark" aria-hidden="true">
        A / {kind.slice(0, 3).toUpperCase()}
      </span>
    </div>
  );
}
