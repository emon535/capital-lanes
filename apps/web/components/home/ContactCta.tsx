import { CONTACT } from "@/content/site";
import { Chat, Phone } from "@/components/home/Icons";

/** Large WhatsApp call to action, with the landline as a second option. */
export function WhatsAppCta() {
  return (
    <div className="wa-cta">
      <a className="wa-main" href={CONTACT.whatsappHref} target="_blank" rel="noopener noreferrer">
        <span className="wa-icon">
          <Chat size={26} strokeWidth={1.5} />
        </span>
        <span className="wa-text">
          <span className="wa-label">Book or ask on WhatsApp</span>
          <span className="wa-number">{CONTACT.whatsappDisplay}</span>
        </span>
      </a>
      <a className="wa-call" href={CONTACT.phoneHref}>
        <Phone size={16} /> or call {CONTACT.phoneDisplay}
      </a>
    </div>
  );
}

/** Fixed bottom bar on phones: one tap to call or open WhatsApp. */
export function MobileContactBar() {
  return (
    <nav className="m-contact" aria-label="Contact us">
      <a href={CONTACT.phoneHref} className="m-call">
        <Phone size={18} /> Call
      </a>
      <a href={CONTACT.whatsappHref} target="_blank" rel="noopener noreferrer" className="m-wa">
        <Chat size={18} /> WhatsApp
      </a>
    </nav>
  );
}
