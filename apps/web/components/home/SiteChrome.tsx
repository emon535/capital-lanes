import Image from "next/image";
import Link from "next/link";
import { COMPANY, CONTACT } from "@/content/site";

export function SiteNav() {
  return (
    <nav className="site-nav" aria-label="Main">
      <div className="wrap">
        <Link href="/" className="brand" aria-label={`${COMPANY.brandName} home`}>
          <Image className="m" src="/brand/logo-mark.png" alt="" width={710} height={512} loading="eager" />
          <Image className="w" src="/brand/logo-word.png" alt={COMPANY.brandName} width={1111} height={118} loading="eager" />
        </Link>
        <div className="nav-links">
          <Link href="/#routes">Airports</Link>
          <Link href="/#fleet">Fleet</Link>
          <Link href="/#business">Business</Link>
          <Link href="/#how">How it works</Link>
          <Link href="/#reviews">Reviews</Link>
          <Link href="/#contact">Contact</Link>
        </div>
        <div className="nav-right">
          <a className="nav-phone" href={CONTACT.phoneHref}>
            {CONTACT.phoneDisplay}
          </a>
          <Link href="/#quote" className="btn btn-ghost">
            Get a quote
          </Link>
        </div>
      </div>
    </nav>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer" id="contact">
      <div className="wrap">
        <div className="cols">
          <div>
            <div className="brand">
              <Image className="m" src="/brand/logo-mark.png" alt="" width={710} height={512} />
              <Image className="w" src="/brand/logo-word.png" alt={COMPANY.brandName} width={1111} height={118} />
            </div>
            <p style={{ marginTop: 22, lineHeight: 1.75, maxWidth: 300 }}>
              Private executive transfers and chauffeur-driven airport journeys across London.
            </p>
            <p style={{ marginTop: 14, lineHeight: 1.9 }}>
              Phone: <a href={CONTACT.phoneHref}>{CONTACT.phoneDisplay}</a>
              <br />
              Mobile: <a href={CONTACT.mobileHref}>{CONTACT.mobileDisplay}</a>
              <br />
              WhatsApp:{" "}
              <a href={CONTACT.whatsappHref} target="_blank" rel="noopener noreferrer">
                Message us
              </a>
            </p>
          </div>
          <div>
            <h3>Airports</h3>
            <ul>
              <li>
                <Link href="/#routes">Heathrow</Link>
              </li>
              <li>
                <Link href="/#routes">Gatwick</Link>
              </li>
            </ul>
          </div>
          <div>
            <h3>Company</h3>
            <ul>
              <li>
                <Link href="/#fleet">Fleet</Link>
              </li>
              <li>
                <Link href="/#business">Business accounts</Link>
              </li>
              <li>Contact</li>
            </ul>
          </div>
          <div>
            <h3>Help</h3>
            <ul>
              <li>Manage booking</li>
              <li>Cancellation policy</li>
              <li>Terms</li>
            </ul>
          </div>
        </div>
        <div className="legal">
          <span>
            © {new Date().getFullYear()} {COMPANY.legalName} · Company no. {CONTACT.companyNumber} · TfL
            Private Hire Operator Licence no. {CONTACT.operatorLicence}
          </span>
          <span>Privacy · Cookies</span>
        </div>
      </div>
    </footer>
  );
}
