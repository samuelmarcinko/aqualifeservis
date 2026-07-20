import { cn } from "@/lib/utils";

/** AQUALIFE brand wordmark (droplet + text). Used in the app shell. */
export function Logo({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden>
        <path
          d="M16 2C16 2 5 14 5 21a11 11 0 0 0 22 0C27 14 16 2 16 2Z"
          fill="url(#als-grad)"
        />
        <path
          d="M11 20a5 5 0 0 0 5 5"
          stroke="#fff"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.85"
        />
        <defs>
          <linearGradient id="als-grad" x1="5" y1="4" x2="27" y2="30" gradientUnits="userSpaceOnUse">
            <stop stopColor="#2FA0E4" />
            <stop offset="1" stopColor="#114EA9" />
          </linearGradient>
        </defs>
      </svg>
      {!compact && (
        <div className="leading-tight">
          <div className="text-sm font-extrabold tracking-tight text-brand-navy">AQUALIFE</div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand">
            Servis
          </div>
        </div>
      )}
    </div>
  );
}
