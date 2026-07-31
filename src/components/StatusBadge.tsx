const STYLE: Record<string, string> = {
  SAVED: 'bg-canvas text-graphite',
  PURCHASED: 'bg-canvas text-ink',
  LISTED: 'bg-canvas text-ink',
  SOLD: 'bg-profit/10 text-profit',
};

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STYLE[status] ?? 'bg-canvas text-graphite'}`}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}
