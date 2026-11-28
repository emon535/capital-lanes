import { FIRST_RIDE_DISCOUNT_PERCENT } from "@capitallanes/pricing";
import { PassengerCarFields } from "@/components/PassengerCarFields";
import { JourneyFields, WhenFields } from "@/components/PlaceField";
import { QuoteTabs } from "@/components/QuoteTabs";
import { askEnabled } from "@/lib/ask";
import { Arrow, Calendar, Check, Clock, Gift, Person, Pin, Plane, Users } from "./Icons";

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
        {FIRST_RIDE_DISCOUNT_PERCENT > 0 && (
          <p className="first-ride">
            <Gift size={16} /> New customers: {FIRST_RIDE_DISCOUNT_PERCENT}% off your first ride
          </p>
        )}
      </div>
      <QuoteTabs askEnabled={askEnabled()}>
      <form action="/quote" method="get" className="body" aria-labelledby="quote-title">
        <JourneyFields fromIcon={<Pin />} toIcon={<Plane />} />

        <WhenFields idPrefix="q" dateIcon={<Calendar />} timeIcon={<Clock />} />

        <PassengerCarFields idPrefix="q" paxIcon={<Users />} carIcon={<Person />} />

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
