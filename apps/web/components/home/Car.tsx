// Saloon silhouette from the premium-black prototype. Shades of black, gold hubs on Luxury.
type CarProps = {
  id: string;
  width: number;
  bodyTop: string;
  bodyBottom: string;
  hub: string;
  glass?: string;
  headlightBeam?: boolean;
  viewBoxWidth?: number;
};

export function Car({
  id,
  width,
  bodyTop,
  bodyBottom,
  hub,
  glass = "#3a3a3a",
  headlightBeam = false,
  viewBoxWidth = 420,
}: CarProps) {
  return (
    <svg
      viewBox={`0 0 ${viewBoxWidth} 125`}
      width={width}
      xmlns="http://www.w3.org/2000/svg"
      style={{ overflow: "visible", maxWidth: "100%", height: "auto" }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`b-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={bodyTop} />
          <stop offset="1" stopColor={bodyBottom} />
        </linearGradient>
        <linearGradient id={`w-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={glass} stopOpacity=".95" />
          <stop offset=".55" stopColor={glass} stopOpacity=".75" />
          <stop offset="1" stopColor="#ffffff" stopOpacity=".25" />
        </linearGradient>
        <radialGradient id={`g-${id}`} cx="0" cy="0.5" r="1">
          <stop offset="0" stopColor="#fff6d8" stopOpacity=".85" />
          <stop offset="1" stopColor="#fff6d8" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`hg-${id}`}>
          <stop offset="0" stopColor="#fff4cf" stopOpacity=".9" />
          <stop offset=".35" stopColor="#ebd3a0" stopOpacity=".35" />
          <stop offset="1" stopColor="#ebd3a0" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`tg-${id}`}>
          <stop offset="0" stopColor="#d4b06a" stopOpacity=".7" />
          <stop offset="1" stopColor="#d4b06a" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* Light layers: styled and animated from glow.css (cl-*) */}
      <path
        className={headlightBeam ? "cl-beam cl-beam-hero" : "cl-beam"}
        d={headlightBeam ? "M398,76 L560,40 L560,120 Z" : "M398,76 L478,56 L478,104 Z"}
        fill={`url(#g-${id})`}
        opacity={headlightBeam ? ".55" : "0"}
      />
      <ellipse cx="211" cy="110" rx="205" ry="7" fill="#000" opacity=".28" />
      <path
        d="M18,96 C16,82 24,72 44,69 L112,62 C132,44 160,32 196,30 L262,30 C292,31 314,44 336,62 L376,67 C396,70 404,80 404,94 L404,100 C404,103 401,105 398,105 L24,105 C20,105 18,102 18,100 Z"
        fill={`url(#b-${id})`}
        stroke={headlightBeam ? "rgba(255,255,255,.28)" : "rgba(255,255,255,.22)"}
        strokeWidth="1.6"
      />
      <path d="M30,84 L396,84" stroke="#fff" strokeOpacity=".14" strokeWidth="1.5" />
      <path d="M128,62 C146,46 168,37 198,36 L256,36 C280,37 298,47 316,62 Z" fill={`url(#w-${id})`} />
      <rect x="214" y="35" width="5" height="28" fill={bodyBottom} />
      <path d="M220,64 L222,102 M140,64 L136,100" stroke="#000" strokeOpacity=".25" strokeWidth="1.2" />
      <rect x="246" y="72" width="16" height="3" rx="1.5" fill="#fff" opacity=".35" />
      <rect x="164" y="72" width="16" height="3" rx="1.5" fill="#fff" opacity=".35" />
      <path className="cl-head" d="M388,74 C396,75 401,79 402,84 L386,84 Z" fill="#fff4cf" />
      <path className="cl-tail" d="M20,78 L32,76 L30,86 L19,86 Z" fill="#8a6a35" />
      <circle className="cl-head-glow" cx="398" cy="79" r="22" fill={`url(#hg-${id})`} />
      <circle className="cl-tail-glow" cx="24" cy="81" r="14" fill={`url(#tg-${id})`} />
      {[104, 322].map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy="104" r="25" fill="#07080a" />
          <circle cx={cx} cy="104" r="20" fill="#16181c" />
          <circle cx={cx} cy="104" r="13" fill={hub} />
          <circle cx={cx} cy="104" r="4.5" fill="#2b2e33" />
        </g>
      ))}
    </svg>
  );
}
