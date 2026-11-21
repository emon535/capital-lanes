import { VEHICLE_CLASSES, VEHICLE_LABELS } from "@capitallanes/pricing";
import { JourneyFields, WhenFields } from "@/components/PlaceField";
import { QuoteTabs } from "@/components/QuoteTabs";
import { askEnabled } from "@/lib/ask";
import { Arrow, Calendar, Check, Clock, Person, Pin, Plane } from "./Icons";

/**
 * Homepage quote box. Shows no prices: it sends the journey details to /quote,
 * where the fare is calculated on the server. Works without JavaScript (plain GET form).
 */
export function QuoteForm() {
  return (
    <div className="quote" id="quote">
      <div className="top">
        <h2 id="quote-title">Get your fixed price</h2>
        <p className="sub">Instant quote. No account, no obligation.</p>
      </div>
      <QuoteTabs askEnabled={askEnabled()}>
      <form action="/quote" method="get" className="body" aria-labelledby="quote-title">
        <JourneyFields fromIcon={<Pin />} toIcon={<Plane />} />

        <WhenFields idPrefix="q" dateIcon={<Calendar />} timeIcon={<Clock />} />

        <div className="qf">
          <Person />
          <div className="field">
            <label htmlFor="q-car">Car class</label>
            <select id="q-car" name="car" required defaultValue="standard">
              <option value="" disabled>
                Standard to Luxury
              </option>
              {VEHICLE_CLASSES.map((v) => (
                <option key={v} value={v}>
                  {VEHICLE_LABELS[v]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button type="submit" className="btn btn-gold">
          Calculate my price <Arrow />
        </button>

        <ul className="fine">
          <li>
            <Check size={13} /> VAT included
          </li>
          <li>
            <Check size={13} /> Drop-off charge included
          </li>
          <li>
            <Check size={13} /> No surge
          </li>
        </ul>
      </form>
      </QuoteTabs>
    </div>
  );
}
