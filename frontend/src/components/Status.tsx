export function Loading() {
  return <p className="py-16 text-center text-muted">Đang tải…</p>;
}

export function ErrorBox({ message }: { message: string }) {
  return (
    <p role="alert" className="mx-auto max-w-xl rounded-xl border border-danger/40 bg-danger/10 p-4 text-danger">
      {message}
    </p>
  );
}
