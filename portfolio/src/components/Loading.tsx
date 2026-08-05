export function Loading() {
  return (
    <div className="container" style={{ padding: '120px 24px', textAlign: 'center' }}>
      <span className="eyebrow">Loading index…</span>
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="container" style={{ padding: '120px 24px', textAlign: 'center' }}>
      <p style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: 14 }}>{message}</p>
    </div>
  );
}
