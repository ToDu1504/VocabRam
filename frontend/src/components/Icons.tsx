type P = { className?: string };
const base = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" } as const;

export const SpeakerIcon = ({ className = "size-5" }: P) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...base}>
    <path d="M11 5 6 9H2v6h4l5 4V5z" />
    <path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14" />
  </svg>
);
export const CheckIcon = ({ className = "size-5" }: P) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...base}>
    <path d="M20 6 9 17l-5-5" />
  </svg>
);
export const BulbIcon = ({ className = "size-5" }: P) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...base}>
    <path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.3h6c0-1 .4-1.8 1-2.3A7 7 0 0 0 12 2z" />
  </svg>
);
export const ArrowLeftIcon = ({ className = "size-5" }: P) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...base}>
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
);
