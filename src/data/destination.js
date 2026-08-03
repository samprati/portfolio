// Personalises the flight's final destination to the visitor's region, so the
// route reads KUL → HYD → <where you are>. Detected entirely client-side from
// the browser TIMEZONE (the real location signal) with locale as a fallback —
// no network, no IP lookup, no tracking.

// `visa` is the relocation / work-authorisation line, tailored to the visitor's
// region so a recruiter reading from their country sees the relevant route in.
const BY_COUNTRY = {
  IN: { code: 'IND', city: 'India', visa: 'Indian citizen · open to remote & relocation' },
  AE: { code: 'DXB', city: 'Dubai', visa: 'Open to UAE employment visa & relocation' },
  SA: { code: 'RUH', city: 'Saudi Arabia', visa: 'Open to KSA employment visa & relocation' },
  QA: { code: 'DOH', city: 'Doha', visa: 'Open to Qatar employment visa & relocation' },
  DE: { code: 'BER', city: 'Berlin', visa: 'EU Blue Card eligible · open to sponsorship' },
  NL: { code: 'AMS', city: 'Amsterdam', visa: 'NL Highly Skilled Migrant · open to sponsorship' },
  FR: { code: 'PAR', city: 'Paris', visa: 'EU Blue Card eligible · open to sponsorship' },
  CH: { code: 'ZRH', city: 'Zürich', visa: 'Swiss work permit · open to sponsorship' },
  SE: { code: 'STO', city: 'Stockholm', visa: 'EU Blue Card eligible · open to sponsorship' },
  ES: { code: 'MAD', city: 'Madrid', visa: 'EU Blue Card eligible · open to sponsorship' },
  IT: { code: 'ROM', city: 'Italy', visa: 'EU Blue Card eligible · open to sponsorship' },
  GB: { code: 'LON', city: 'London', visa: 'UK Skilled Worker visa · open to sponsorship' },
  IE: { code: 'DUB', city: 'Dublin', visa: 'Ireland Critical Skills · open to sponsorship' },
  US: { code: 'USA', city: 'United States', visa: 'Open to relocation · sponsorship (H-1B / O-1)' },
  CA: { code: 'YYZ', city: 'Canada', visa: 'Canada Express Entry / work permit · open to relocation' },
  SG: { code: 'SIN', city: 'Singapore', visa: 'Singapore Employment Pass · open to sponsorship' },
  AU: { code: 'SYD', city: 'Australia', visa: 'Australia skilled visa · open to sponsorship' },
  NZ: { code: 'AKL', city: 'New Zealand', visa: 'NZ skilled visa · open to sponsorship' },
  MY: { code: 'KUL', city: 'Malaysia', visa: 'Malaysia Employment Pass · open to relocation' },
  JP: { code: 'TYO', city: 'Tokyo', visa: 'Japan work visa · open to relocation' },
}

// common IANA timezones → country (the primary, reliable signal)
const BY_TZ = {
  'Asia/Kolkata': 'IN',
  'Asia/Calcutta': 'IN',
  'Asia/Dubai': 'AE',
  'Asia/Qatar': 'QA',
  'Asia/Riyadh': 'SA',
  'Asia/Singapore': 'SG',
  'Asia/Kuala_Lumpur': 'MY',
  'Asia/Tokyo': 'JP',
  'Europe/Berlin': 'DE',
  'Europe/Amsterdam': 'NL',
  'Europe/London': 'GB',
  'Europe/Dublin': 'IE',
  'Europe/Paris': 'FR',
  'Europe/Zurich': 'CH',
  'Europe/Madrid': 'ES',
  'Europe/Rome': 'IT',
  'Europe/Stockholm': 'SE',
  'Pacific/Auckland': 'NZ',
}

// where Samprati is actually heading — used when we can't place the visitor
const DEFAULT = { code: 'BER', city: 'Berlin / Amsterdam', visa: 'EU Blue Card · NL Highly Skilled Migrant eligible' }

function countryFromTimeZone() {
  let tz = ''
  try {
    tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''
  } catch { /* ignore */ }
  if (BY_TZ[tz]) return BY_TZ[tz]
  // broad prefixes for regions with many zones
  if (tz.startsWith('Australia/')) return 'AU'
  if (tz.startsWith('America/')) return 'US' // approx (incl. Canada/LatAm)
  return null
}

function countryFromLocale() {
  try {
    const region = new Intl.Locale(navigator.language).region
    if (region) return region.toUpperCase()
  } catch { /* ignore */ }
  const parts = (navigator.language || '').split('-')
  return parts[1] ? parts[1].toUpperCase() : null
}

export function getDestination() {
  // timezone first (where you actually are), locale second (often just en-US)
  const country = countryFromTimeZone() || countryFromLocale()
  const base = (country && BY_COUNTRY[country]) || DEFAULT
  const isHome = country === 'IN'
  return {
    ...base,
    isHome,
    // the "LOCATION" line: Samprati is in Hyderabad, heading to the visitor's
    // region (or already local for India visitors)
    locationLine: isHome ? 'Hyderabad, India · available locally' : `Hyderabad, India → ${base.city}`,
    // label for the relocation/visa row (India visitors see a status, not a visa)
    visaLabel: isHome ? 'STATUS' : 'VISA',
  }
}
