import Image from "next/image";
import { cn, initials } from "@/lib/utils";

type Props = {
  src?: string | null;
  name: string;
  className?: string;
} & ({ fill: true } | { fill?: false; size: number });

// Some source photos aren't perfectly centered on the subject once cropped to
// the card's 4:5 box. Rather than re-cropping the file, nudge the visible
// crop window per-image via object-position. Keyed by src so this only
// affects the specific photo that needs it.
const OBJECT_POSITION_OVERRIDES: Record<string, string> = {
  "/uploads/nijat-hatamli.jpg": "62% center",
};

export function TeacherPhoto(props: Props) {
  const { src, name, className } = props;
  const objectPosition = src ? OBJECT_POSITION_OVERRIDES[src] : undefined;

  if (src) {
    return props.fill ? (
      <Image
        src={src}
        alt={name}
        fill
        sizes="(max-width: 768px) 100vw, 33vw"
        className={cn("object-cover", className)}
        style={objectPosition ? { objectPosition } : undefined}
      />
    ) : (
      <Image
        src={src}
        alt={name}
        width={props.size}
        height={props.size}
        className={cn("object-cover", className)}
        style={objectPosition ? { objectPosition } : undefined}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center bg-gradient-to-br from-electric-500/15 to-primary/20 font-display text-secondary dark:text-white",
        props.fill && "absolute inset-0",
        className
      )}
      style={!props.fill ? { width: props.size, height: props.size } : undefined}
    >
      <span style={{ fontSize: props.fill ? "2.5rem" : Math.round(props.size * 0.32) }}>
        {initials(name)}
      </span>
    </div>
  );
}
