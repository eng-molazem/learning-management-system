import clsx from "clsx";
import type { HTMLAttributes } from "react";

export default function GlassCard({
  className,
  strong,
  ...props
}: HTMLAttributes<HTMLDivElement> & { strong?: boolean }) {
  return (
    <div
      className={clsx(strong ? "glass-strong" : "glass-card", "p-5", className)}
      {...props}
    />
  );
}
