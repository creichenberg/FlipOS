const STYLE: Record<string, string> = {
  SAVED: 'bg-paper-dim text-graphite',
  PURCHASED: 'bg-caution-soft text-caution',
  LISTED: 'bg-caution-soft text-caution',
  SOLD: 'bg-profit-soft text-profit',
};

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STYLE[status] ?? 'bg-paper-dim text-graphite'}`}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}
