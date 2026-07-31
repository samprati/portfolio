// Personalises the flight's final destination to the visitor's region, so the
// route reads KUL → HYD → <where you are>. Detected entirely client-side from
// the browser TIMEZONE (the real location signal) with locale as a fallback —
// no network, no IP lookup, no tracking.

const BY_COUNTRY = {
  IN: { code: 'IND', city: 'India' },
  AE: { code: 'DXB', city: 'Dubai' },
  DE: { code: 'BER', city: 'Berlin' },
  NL: { code: 'AMS', city: 'Amsterdam' },
  GB: { code: 'LON', city: 'London' },
  IE: { code: 'DUB', city: 'Dublin' },
  US: { code: 'USA', city: 'United States' },
  CA: { code: 'YYZ', city: 'Canada' },
  SG: { code: 'SIN', city: 'Singapore' },
  AU: { code: 'SYD', city: 'Australia' },
  NZ: { code: 'AKL', city: 'New Zealand' },
  MY: { code: 'KUL', city: 'Malaysia' },
  FR: { code: 'PAR', city: 'Paris' },
  CH: { code: 'ZRH', city: 'Zürich' },
  SE: { code: 'STO', city: 'Stockholm' },
  ES: { code: 'MAD', city: 'Madrid' },
  IT: { code: 'ROM', city: 'Italy' },
  JP: { code: 'TYO', city: 'Tokyo' },
  SA: { code: 'RUH', city: 'Saudi Arabia' },
  QA: { code: 'DOH', city: 'Doha' },
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
const DEFAULT = { code: 'BER', city: 'Berlin / Amsterdam' }

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
  return (country && BY_COUNTRY[country]) || DEFAULT
}
