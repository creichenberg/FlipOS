const STYLE: Record<string, string> = {
  SAVED: 'bg-white/10 text-graphite',
  PURCHASED: 'bg-caution-soft text-caution',
  LISTED: 'bg-caution-soft text-caution',
  SOLD: 'bg-profit-soft text-profit',
};

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`chip ${STYLE[status] ?? 'bg-white/10 text-graphite'}`}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}
