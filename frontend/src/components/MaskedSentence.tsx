import { splitExample } from "@/lib/answer";

// Hides the {{...}} span with one * per character; once answered, shows it highlighted.
export function MaskedSentence({ text, revealed }: { text: string; revealed: boolean }) {
  const { before, target, after } = splitExample(text);
  return (
    <p className="text-lg leading-relaxed">
      {before}
      {revealed ? (
        <mark className="rounded bg-success/20 px-1 font-semibold text-success">{target}</mark>
      ) : (
        <span className="font-mono tracking-wider text-muted" aria-label={`${target.length} ký tự bị che`}>
          {"*".repeat(target.length)}
        </span>
      )}
      {after}
    </p>
  );
}
