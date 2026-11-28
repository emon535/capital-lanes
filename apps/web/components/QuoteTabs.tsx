"use client";

import { useId, useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";

interface Fields {
  pickup: string | null;
  dropoff: string | null;
  date: string | null;
  time: string | null;
  passengers: number | null;
  bags: number | null;
  vehicle: string | null;
  return_trip: boolean;
  return_date: string | null;
  return_time: string | null;
  flight_number: string | null;
  notes: string | null;
  question: string | null;
}

const EXAMPLE = "Liverpool Street to Heathrow T5 on Friday at 6am, 5 people with 5 bags";

/**
 * Two ways to start a quote: the normal form ("Calculate it yourself") or a
 * plain-English request ("Just ask me") that fills that form for the customer to check.
 * The fare itself is always calculated on the server from the form, never by the AI.
 */
export function QuoteTabs({ askEnabled, children }: { askEnabled: boolean; children: ReactNode }) {
  const [tab, setTab] = useState<"form" | "ask">("form");
  const id = useId();
  if (!askEnabled) return <>{children}</>;

  return (
    <>
      <div className="qtabs" role="tablist" aria-label="How would you like to get a price?">
        <button
          type="button"
          role="tab"
          id={`${id}-t1`}
          aria-controls={`${id}-p1`}
          aria-selected={tab === "form"}
          onClick={() => setTab("form")}
        >
          Calculate it yourself
        </button>
        <button
          type="button"
          role="tab"
          id={`${id}-t2`}
          aria-controls={`${id}-p2`}
          aria-selected={tab === "ask"}
          onClick={() => setTab("ask")}
        >
          Just ask me
        </button>
      </div>
      <div role="tabpanel" id={`${id}-p1`} aria-labelledby={`${id}-t1`} hidden={tab !== "form"}>
        {children}
      </div>
      <div role="tabpanel" id={`${id}-p2`} aria-labelledby={`${id}-t2`} hidden={tab !== "ask"}>
        <AskPanel />
      </div>
    </>
  );
}

function AskPanel() {
  const router = useRouter();
  const id = useId();
  const [text, setText] = useState("");
  const [state, setState] = useState<"idle" | "busy">("idle");
  const [message, setMessage] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (text.trim().length < 5) {
      setMessage("Tell us where from, where to and when.");
      return;
    }
    setState("busy");
    setMessage(null);
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (res.status === 429) throw new Error("Lots of requests just now. Please use the form, or try again shortly.");
      if (!res.ok) throw new Error("Sorry, we could not read that just now. Please use the form instead.");
      const { fields } = (await res.json()) as { fields: Fields };

      if (!fields.pickup || !fields.dropoff) {
        setMessage(fields.question ?? "Where should we pick you up, and where are you going?");
        setState("idle");
        return;
      }

      const notes = [
        fields.flight_number && `Flight ${fields.flight_number}`,
        fields.return_trip &&
          `Return trip${fields.return_date ? ` on ${fields.return_date}` : ""}${fields.return_time ? ` at ${fields.return_time}` : ""}`,
        fields.notes,
      ]
        .filter(Boolean)
        .join(". ");

      const qs = new URLSearchParams({ review: "1", from: fields.pickup, to: fields.dropoff });
      if (fields.date) qs.set("date", fields.date);
      if (fields.time) qs.set("time", fields.time);
      if (fields.vehicle) qs.set("car", fields.vehicle);
      if (fields.passengers) qs.set("pax", String(fields.passengers));
      if (fields.bags != null) qs.set("bags", String(fields.bags));
      if (notes) qs.set("note", notes.slice(0, 200));
      router.push(`/quote?${qs}`);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Something went wrong. Please use the form instead.");
      setState("idle");
    }
  };

  return (
    <form className="body ask" onSubmit={submit}>
      <label htmlFor={`${id}-text`} className="ask-label">
        Tell us your journey in your own words
      </label>
      <textarea
        id={`${id}-text`}
        rows={4}
        maxLength={600}
        placeholder={`e.g. ${EXAMPLE}`}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) (e.currentTarget.form as HTMLFormElement).requestSubmit();
        }}
      />
      {message && (
        <p className="ask-msg" role="status">
          {message}
        </p>
      )}
      <button type="submit" className="btn btn-gold" disabled={state === "busy"}>
        {state === "busy" ? "Reading your request..." : "Fill in my journey"}
      </button>
      <p className="ask-fine">We fill in the form for you to check. The price is always our fixed tariff.</p>
    </form>
  );
}
