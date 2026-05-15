import { AlertTriangle, Info, CheckCircle2 } from "lucide-react";

interface Props {
  type?: "warning" | "info" | "success";
  title?: string;
  children: React.ReactNode;
}

const config = {
  warning: {
    Icon: AlertTriangle,
    color: "var(--orange)",
    bg: "rgba(224, 138, 64, 0.08)",
    border: "rgba(224, 138, 64, 0.35)",
  },
  info: {
    Icon: Info,
    color: "var(--purple-light)",
    bg: "rgba(56, 0, 168, 0.12)",
    border: "rgba(85, 32, 212, 0.4)",
  },
  success: {
    Icon: CheckCircle2,
    color: "var(--green)",
    bg: "rgba(76, 175, 130, 0.08)",
    border: "rgba(76, 175, 130, 0.35)",
  },
};

export function Callout({ type = "info", title, children }: Props) {
  const { Icon, color, bg, border } = config[type];
  return (
    <aside
      className="my-6 flex gap-4 rounded-sm p-5"
      style={{ background: bg, borderLeft: `3px solid ${color}`, border: `1px solid ${border}` }}
    >
      <Icon className="mt-0.5 h-5 w-5 flex-shrink-0" style={{ color }} />
      <div className="flex-1">
        {title && (
          <div
            className="mb-1 text-sm font-semibold uppercase tracking-wider"
            style={{ color }}
          >
            {title}
          </div>
        )}
        <div className="text-sm text-[var(--white)]/90">{children}</div>
      </div>
    </aside>
  );
}
