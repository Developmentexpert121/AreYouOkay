interface StatusBadgeProps {
  status: "success" | "warning" | "danger" | "neutral";
  children: React.ReactNode;
}

const classes = {
  success: "badge-success",
  warning: "badge-warning",
  danger: "badge-danger",
  neutral: "badge-neutral",
};

export function StatusBadge({ status, children }: StatusBadgeProps) {
  return <span className={classes[status || 'neutral']}>{children}</span>;
}
