// Single source of truth for company details and the customer promise.
// Never write variations of these elsewhere; import from here.

export const COMPANY = {
  legalName: "Capital Lane Ltd",
  brandName: "Capital Lane",
  tagline: "Private executive transfers and chauffeur-driven airport journeys in London",
  // TODO(Emon): add TfL operator licence number and Companies House number before launch.
} as const;

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const PROMISE = [
  {
    title: "Fixed, all-in fare",
    body: "The price you see includes VAT, parking and the airport drop-off charge.",
  },
  {
    title: "60 minutes free waiting",
    body: "For airport pickups, counted from when your flight actually lands.",
  },
  {
    title: "Flight tracking",
    body: "We watch your flight, so an early or late landing is no problem.",
  },
  {
    title: "Meet and greet",
    body: "Your chauffeur waits in arrivals with a name board.",
  },
  {
    title: "Free cancellation",
    body: "Cancel up to 24 hours before pickup at no cost.",
  },
  {
    title: "Free child seats",
    body: "Tell us the ages when you book and we will fit the right seats.",
  },
] as const;

// Fleet photos: representative royalty-free photos from Unsplash (free for commercial use,
// https://unsplash.com/license), hot-linked from Unsplash's image CDN. Swap for photos of
// Capital Lane's own cars when they are ready: put them in public/fleet/ and change `photo`.
const unsplash = (id: string) => `https://images.unsplash.com/${id}`;

export const VEHICLES = {
  standard: {
    model: "Saloon",
    description: "A clean, comfortable saloon for everyday journeys and airport runs.",
    photo: unsplash("photo-1547731034-4c72e102212c"),
    photoAlt: "Black saloon car, side view",
    crop: "",
    credit: "Arteum.ro on Unsplash",
  },
  "business-comfort": {
    model: "Premium saloon",
    description: "A newer premium saloon with extra legroom and boot space.",
    photo: unsplash("photo-1714434087684-a2f4816ca832"),
    photoAlt: "Black premium saloon parked outside a building",
    crop: "&crop=focalpoint&fp-x=0.5&fp-y=0.56&fp-z=1.5",
    credit: "Rana Singh on Unsplash",
  },
  executive: {
    model: "Mercedes C-Class, E-Class or similar",
    description: "An executive car for business travel and a quieter ride.",
    photo: unsplash("photo-1592309905620-e5b59f6dcb98"),
    photoAlt: "Front of a black Mercedes saloon at dusk",
    crop: "",
    credit: "Artur Kulagin on Unsplash",
  },
  luxury: {
    model: "Mercedes S-Class or similar",
    description: "Our flagship car for VIP guests, roadshows and special occasions.",
    photo: unsplash("photo-1610099610040-ab19f3a5ec35"),
    photoAlt: "Black Mercedes S-Class on a cobbled street",
    crop: "&crop=focalpoint&fp-x=0.52&fp-y=0.6&fp-z=1.25",
    credit: "Martin Katler on Unsplash",
  },
  mpv: {
    model: "7-seater MPV, Mercedes V-Class or similar",
    description: "Room for up to 6 passengers and their luggage. Ideal for families and teams.",
    photo: unsplash("photo-1765461734605-34657fa04db2"),
    photoAlt: "Black Mercedes people carrier with headlights on",
    crop: "",
    credit: "William G on Unsplash",
  },
} as const;

/**
 * Image URL from Unsplash's CDN at a given size (it resizes, crops and picks the format).
 * `crop` holds optional focal-point parameters that frame the car.
 */
export function fleetPhoto(photo: { photo: string; crop: string }, width: number, height: number) {
  return `${photo.photo}?auto=format&fit=crop&w=${width}&h=${height}&q=70${photo.crop}`;
}

export const HOW_IT_WORKS = [
  {
    step: "1",
    title: "Calculate your price",
    body: "Choose your airport, time and car. Your fixed, all-in fare appears instantly.",
  },
  {
    step: "2",
    title: "Add your flight",
    body: "We track your flight and move your pickup if you land early or late.",
  },
  {
    step: "3",
    title: "Meet your chauffeur",
    body: "At your door, your office or in arrivals with your name on a board. Driver details arrive by text.",
  },
] as const;

export const CONTACT = {
  phoneDisplay: "020 4509 9331",
  phoneHref: "tel:+442045099331",
  phoneE164: "+442045099331",
  mobileDisplay: "07514 347772",
  mobileHref: "tel:+447514347772",
  whatsappDisplay: "+44 7514 347772",
  whatsappHref: `https://wa.me/447514347772?text=${encodeURIComponent(
    "Hello Capital Lane, I would like to book a transfer.",
  )}`,
  whatsappBusinessHref: `https://wa.me/447514347772?text=${encodeURIComponent(
    "Hello Capital Lane, I would like to set up a business account with invoicing.",
  )}`,
  // Placeholders: clearly marked until Capital Lane Ltd supplies the real details.
  companyNumber: "[company no. to add]",
  operatorLicence: "[TfL operator licence no. to add]",
} as const;

export const SIGNATURE_LINE = "Your driver, our car, every time.";

export const ROUTES = [
  {
    airport: "heathrow",
    code: "LHR",
    name: "Heathrow",
    journey: "50–70 min",
    terminals: "T2 · T3 · T4 · T5",
  },
  {
    airport: "gatwick",
    code: "LGW",
    name: "Gatwick",
    journey: "60–80 min",
    terminals: "North · South",
  },
] as const;

export const CORPORATE = [
  {
    title: "Invoice on request",
    body: "Ask for an invoice on any journey, with your company name, VAT and a reference such as a cost code or PO.",
  },
  {
    title: "Monthly account billing",
    body: "Approved business accounts can book through the month and settle with one invoice.",
  },
  {
    title: "Guests and roadshows",
    body: "Book for clients, visitors and staff. We meet them in arrivals and keep you updated.",
  },
  {
    title: "Priority service",
    body: "A named contact for your bookings, and executive cars held for your regular journeys.",
  },
] as const;

// SAMPLE reviews for layout only. Replace with real Google / Trustpilot reviews before launch.
export const SAMPLE_REVIEWS = [
  {
    quote:
      "Driver was waiting outside our building ten minutes early. The fare was exactly what the website said, nothing added.",
    name: "Sample reviewer A",
    trip: "Mayfair to Heathrow T5",
  },
  {
    quote:
      "Flight landed 40 minutes late and the chauffeur was still there with a name board. No extra charge.",
    name: "Sample reviewer B",
    trip: "Gatwick North to the City",
  },
  {
    quote:
      "We book all our client pickups through Capital Lane now. Invoices are clean and drivers are always smart.",
    name: "Sample reviewer C",
    trip: "Business account",
  },
] as const;
