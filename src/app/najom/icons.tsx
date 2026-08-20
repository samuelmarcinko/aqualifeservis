/** Clean flat line/solid icons for the storefront (navy on light-blue tiles). */

type IconProps = { className?: string };

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function BoltIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path {...stroke} d="M13 2 4 13h6l-1 9 9-12h-6l1-8Z" />
    </svg>
  );
}

export function MedalIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <circle {...stroke} cx="12" cy="9" r="5" />
      <path {...stroke} d="m8.5 13-2 8 5.5-3 5.5 3-2-8" />
    </svg>
  );
}

export function TruckIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path {...stroke} d="M2.5 6.5h11v9h-11zM13.5 9.5H18l3.5 3.5v2.5h-8z" />
      <circle {...stroke} cx="7" cy="17.5" r="1.6" />
      <circle {...stroke} cx="17" cy="17.5" r="1.6" />
    </svg>
  );
}

export function ChatIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path {...stroke} d="M4 5h16v10H9l-4 4v-4H4z" />
      <path {...stroke} d="M8 9h8M8 12h5" />
    </svg>
  );
}

export function CalendarIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <rect {...stroke} x="3.5" y="5" width="17" height="15" rx="2" />
      <path {...stroke} d="M3.5 9.5h17M8 3v4M16 3v4" />
    </svg>
  );
}

export function CalendarCheckIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <rect {...stroke} x="3.5" y="5" width="17" height="15" rx="2" />
      <path {...stroke} d="M3.5 9.5h17M8 3v4M16 3v4M9 14.5l2 2 3.5-3.5" />
    </svg>
  );
}

export function DocumentIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path {...stroke} d="M7 3h6l5 5v13H7zM13 3v5h5" />
      <path {...stroke} d="M10 13h5M10 16.5h5" />
    </svg>
  );
}

export function PhoneIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M6.6 10.8a15.5 15.5 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.4c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.4 0 .8-.3 1l-2.1 2.2Z" />
    </svg>
  );
}
