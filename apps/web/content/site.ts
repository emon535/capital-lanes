// Single source of truth for company details and the customer promise.
// Never write variations of these elsewhere; import from here.

export const COMPANY = {
  legalName: "Capital Lane Ltd",
  brandName: "Capital Lane",
  tagline: "Chauffeur-driven airport transfers from Canary Wharf",
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

export const VEHICLE_DESCRIPTIONS = {
  standard: "A comfortable, clean saloon for everyday airport runs.",
  "business-comfort": "A newer premium saloon with extra legroom and boot space.",
  executive: "An executive car for business travel and a quieter ride.",
  luxury: "Our top-tier car for special occasions and VIP travel.",
} as const;

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
    body: "At your door in E14, or in arrivals with your name on a board. Driver details arrive by text.",
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
    "Hello Capital Lane, I would like to book an airport transfer.",
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

// SAMPLE reviews for layout only. Replace with real Google / Trustpilot reviews before launch.
export const SAMPLE_REVIEWS = [
  {
    quote:
      "Driver was waiting outside our building ten minutes early. The fare was exactly what the website said, nothing added.",
    name: "Sample reviewer A",
    trip: "Canary Wharf to Heathrow T5",
  },
  {
    quote:
      "Flight landed 40 minutes late and the chauffeur was still there with a name board. No extra charge.",
    name: "Sample reviewer B",
    trip: "Gatwick North to E14",
  },
  {
    quote:
      "We book all our client pickups through Capital Lane now. Invoices are clean and drivers are always smart.",
    name: "Sample reviewer C",
    trip: "Business account",
  },
] as const;
