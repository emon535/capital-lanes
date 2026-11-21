// Line icons from the premium-black prototype. All decorative (aria-hidden).
type P = { size?: number; strokeWidth?: number };

function Svg({
  size = 19,
  strokeWidth = 1.6,
  children,
  fill = "none",
}: P & { children: React.ReactNode; fill?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export const Arrow = (p: P) => (
  <Svg size={16} strokeWidth={2} {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Svg>
);
export const Check = (p: P) => (
  <Svg size={15} strokeWidth={2} {...p}>
    <path d="M5 12.5l4.5 4.5L19 7" />
  </Svg>
);
export const Pin = (p: P) => (
  <Svg {...p}>
    <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" />
    <circle cx="12" cy="9.5" r="2.5" />
  </Svg>
);
export const Plane = (p: P) => (
  <Svg {...p}>
    <path d="M21 15.5l-8-4.5V5.5a1.5 1.5 0 0 0-3 0V11l-8 4.5V17l8-2.2V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-4.2l8 2.2z" />
  </Svg>
);
export const Calendar = (p: P) => (
  <Svg {...p}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M3 10h18M8 3v4M16 3v4M9 15.5l2 2 4-4" />
  </Svg>
);
export const Clock = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3.5 2" />
  </Svg>
);
export const Person = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
  </Svg>
);
export const Pound = (p: P) => (
  <Svg {...p}>
    <path d="M16 6.5A4 4 0 0 0 9 8.8V18M6 12.5h7M6 18h11" />
  </Svg>
);
export const Board = (p: P) => (
  <Svg {...p}>
    <rect x="3" y="4" width="18" height="11" rx="1.5" />
    <path d="M7 9.5h10M12 15v6M8 21h8" />
  </Svg>
);
export const Seat = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="5" r="2.5" />
    <path d="M7 21v-6a5 5 0 0 1 10 0v6M5 21h14" />
  </Svg>
);
export const Shield = (p: P) => (
  <Svg {...p}>
    <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" />
    <path d="M9 12l2 2 4-4" />
  </Svg>
);
export const Phone = (p: P) => (
  <Svg {...p}>
    <rect x="6" y="2" width="12" height="20" rx="2.5" />
    <path d="M10.5 18.5h3" />
  </Svg>
);
export const Card = (p: P) => (
  <Svg {...p}>
    <rect x="2.5" y="5" width="19" height="14" rx="2" />
    <path d="M2.5 10h19M6 15h4" />
  </Svg>
);
export const Star = () => (
  <Svg size={15} strokeWidth={1.2} fill="currentColor">
    <path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" />
  </Svg>
);
