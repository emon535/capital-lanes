"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";

interface Suggestion {
  placeId: string;
  text: string;
  main: string;
  secondary: string;
}

/** Quick picks under the drop-off box. Text is what Google routes to. */
export const QUICK_AIRPORTS = [
  { label: "Heathrow", text: "Heathrow Airport, Hounslow TW6" },
  { label: "Gatwick", text: "Gatwick Airport, Horley RH6 0NP" },
  { label: "Stansted", text: "Stansted Airport, Stansted CM24 1QW" },
  { label: "Luton", text: "Luton Airport, Luton LU2 9LY" },
  { label: "London City", text: "London City Airport, London E16 2PX" },
  { label: "Southend", text: "Southend Airport, Southend-on-Sea SS2 6YF" },
  { label: "Birmingham", text: "Birmingham Airport, Birmingham B26 3QJ" },
  { label: "Manchester", text: "Manchester Airport, Manchester M90 1QX" },
] as const;

interface PlaceValue {
  text: string;
  placeId: string;
}

interface Props {
  /** Form field name for the text. The chosen Google place goes in `${name}Id`. */
  name: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  value: PlaceValue;
  onChange: (v: PlaceValue) => void;
  /** Shared session token for this form's suggestion requests. */
  sessionToken?: string;
  /** Small control at the right of the box (e.g. "Use my location"). */
  action?: ReactNode;
}

/**
 * Address input with suggestions from our own /api/places/autocomplete proxy.
 * Without JavaScript, or with no Google key, it is a plain text input.
 */
function PlaceField({ name, label, placeholder, required, value, onChange, sessionToken, action }: Props) {
  const id = useId();
  const listId = `${id}-list`;
  const [items, setItems] = useState<Suggestion[]>([]);
  const [active, setActive] = useState(-1);
  const [open, setOpen] = useState(false);
  const disabled = useRef(false);
  const typed = useRef(false);

  useEffect(() => {
    if (!typed.current || disabled.current) return;
    const q = value.text.trim();
    if (q.length < 3 || value.placeId) {
      setItems([]);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const qs = new URLSearchParams({ q, ...(sessionToken ? { s: sessionToken } : {}) });
        const res = await fetch(`/api/places/autocomplete?${qs}`, { signal: ctrl.signal });
        const data = (await res.json()) as { enabled?: boolean; suggestions?: Suggestion[] };
        if (data.enabled === false) disabled.current = true;
        setItems(data.suggestions ?? []);
        setActive(-1);
        setOpen(true);
      } catch {
        /* aborted or offline: keep plain text */
      }
    }, 220);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [value.text, value.placeId, sessionToken]);

  const choose = (s: Suggestion) => {
    onChange({ text: s.text, placeId: s.placeId });
    setItems([]);
    setOpen(false);
  };

  const showList = open && items.length > 0;

  return (
    <>
      <div className="field">
        <label htmlFor={id}>{label}</label>
        <input
          id={id}
          name={name}
          type="text"
          autoComplete="off"
          required={required}
          placeholder={placeholder}
          value={value.text}
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={showList && active >= 0 ? `${listId}-${active}` : undefined}
          onChange={(e) => {
            typed.current = true;
            onChange({ text: e.target.value, placeId: "" });
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={(e) => {
            if (!showList) return;
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((a) => (a + 1) % items.length);
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => (a <= 0 ? items.length - 1 : a - 1));
            } else if (e.key === "Enter" && active >= 0) {
              e.preventDefault();
              choose(items[active]);
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
        />
        <input type="hidden" name={`${name}Id`} value={value.placeId} />
        <ul id={listId} role="listbox" className="ac-list" hidden={!showList}>
          {items.map((s, i) => (
            <li
              key={s.placeId}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => {
                e.preventDefault();
                choose(s);
              }}
            >
              <b>{s.main}</b>
              {s.secondary && <span>{s.secondary}</span>}
            </li>
          ))}
        </ul>
      </div>
      {action}
    </>
  );
}

function LocateButton({ onFound }: { onFound: (v: PlaceValue) => void }) {
  const [state, setState] = useState<"idle" | "busy" | "error">("idle");
  const [supported, setSupported] = useState(false);
  useEffect(() => setSupported(typeof navigator !== "undefined" && "geolocation" in navigator), []);
  if (!supported) return null;

  const locate = () => {
    setState("busy");
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const qs = new URLSearchParams({ lat: String(coords.latitude), lng: String(coords.longitude) });
          const res = await fetch(`/api/places/reverse?${qs}`);
          if (!res.ok) throw new Error(String(res.status));
          const p = (await res.json()) as { placeId: string; text: string };
          onFound({ text: p.text, placeId: p.placeId });
          setState("idle");
        } catch {
          setState("error");
        }
      },
      () => setState("error"),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  };

  return (
    <button
      type="button"
      className="locate"
      onClick={locate}
      disabled={state === "busy"}
      title={state === "error" ? "Could not find your location. Please type the address." : "Use my current location"}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
      </svg>
      <span>{state === "busy" ? "Finding..." : state === "error" ? "Not found" : "My location"}</span>
    </button>
  );
}

interface JourneyProps {
  from?: string;
  fromId?: string;
  to?: string;
  toId?: string;
  fromIcon?: ReactNode;
  toIcon?: ReactNode;
}

/** Pick-up and drop-off inputs sharing one suggestion session, with quick airport picks. */
export function JourneyFields({ from = "", fromId = "", to = "", toId = "", fromIcon, toIcon }: JourneyProps) {
  const [pickup, setPickup] = useState<PlaceValue>({ text: from, placeId: fromId });
  const [dropoff, setDropoff] = useState<PlaceValue>({ text: to, placeId: toId });
  // Created after hydration so server and browser HTML match.
  const [token, setToken] = useState("");
  useEffect(() => {
    setToken(typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now()));
  }, []);

  return (
    <>
      <div className="qf">
        {fromIcon}
        <PlaceField
          name="from"
          label="Pick-up"
          placeholder="Address, postcode or place"
          required
          value={pickup}
          onChange={setPickup}
          sessionToken={token || undefined}
          action={<LocateButton onFound={setPickup} />}
        />
      </div>
      <div className="qf">
        {toIcon}
        <PlaceField
          name="to"
          label="Drop-off"
          placeholder="Address, postcode, airport or station"
          required
          value={dropoff}
          onChange={setDropoff}
          sessionToken={token || undefined}
        />
      </div>
      <div className="chips" role="group" aria-label="Quick airport picks">
        {QUICK_AIRPORTS.map((a) => (
          <button
            key={a.label}
            type="button"
            className={dropoff.text === a.text ? "on" : undefined}
            aria-pressed={dropoff.text === a.text}
            onClick={() => setDropoff({ text: a.text, placeId: "" })}
          >
            {a.label}
          </button>
        ))}
      </div>
      <input type="hidden" name="s" value={token} />
    </>
  );
}

/** Now in UK time, rounded up to the next 5 minutes. */
function londonNow() {
  const step = 5 * 60000;
  const d = new Date(Math.ceil(Date.now() / step) * step);
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/London",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(d)
      .map((p) => [p.type, p.value]),
  );
  return { date: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}` };
}

/** Date and time boxes, set to today and now (UK time) unless the link already has them. */
export function WhenFields({
  date: d0 = "",
  time: t0 = "",
  idPrefix,
  dateIcon,
  timeIcon,
}: {
  date?: string;
  time?: string;
  idPrefix: string;
  dateIcon?: ReactNode;
  timeIcon?: ReactNode;
}) {
  const [date, setDate] = useState(d0);
  const [time, setTime] = useState(t0);
  const [min, setMin] = useState<string>();
  useEffect(() => {
    const now = londonNow();
    setMin(now.date);
    if (!d0) setDate(now.date);
    if (!t0) setTime(now.time);
  }, [d0, t0]);

  return (
    <div className="q2">
      <div className="qf">
        {dateIcon}
        <div className="field">
          <label htmlFor={`${idPrefix}-date`}>Date</label>
          <input
            id={`${idPrefix}-date`}
            name="date"
            type="date"
            min={min}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
      </div>
      <div className="qf">
        {timeIcon}
        <div className="field">
          <label htmlFor={`${idPrefix}-time`}>Time</label>
          <input id={`${idPrefix}-time`} name="time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </div>
      </div>
    </div>
  );
}
