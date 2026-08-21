// IATA 2-letter code + name — major domestic (Indian) and international
// carriers relevant to AirDunia's flight inventory. Not exhaustive (there is
// no single global master list wired into this codebase yet), but covers
// every carrier staff realistically type in here.
export interface Airline { code: string; name: string }

export const AIRLINES: Airline[] = [
  // India — domestic
  { code: '6E', name: 'IndiGo' },
  { code: 'AI', name: 'Air India' },
  { code: 'IX', name: 'Air India Express' },
  { code: 'SG', name: 'SpiceJet' },
  { code: 'UK', name: 'Vistara' },
  { code: 'QP', name: 'Akasa Air' },
  { code: 'G8', name: 'Go First' },
  { code: 'I5', name: 'AIX Connect' },
  { code: '9I', name: 'Alliance Air' },
  { code: 'S5', name: 'Star Air' },
  { code: '2T', name: 'FlyBig' },

  // Middle East / Gulf
  { code: 'EK', name: 'Emirates' },
  { code: 'EY', name: 'Etihad Airways' },
  { code: 'QR', name: 'Qatar Airways' },
  { code: 'WY', name: 'Oman Air' },
  { code: 'GF', name: 'Gulf Air' },
  { code: 'SV', name: 'Saudia' },
  { code: 'FZ', name: 'flydubai' },
  { code: 'G9', name: 'Air Arabia' },
  { code: 'XY', name: 'flynas' },
  { code: 'J9', name: 'Jazeera Airways' },
  { code: 'KU', name: 'Kuwait Airways' },

  // Southeast / East Asia
  { code: 'SQ', name: 'Singapore Airlines' },
  { code: 'MH', name: 'Malaysia Airlines' },
  { code: 'TG', name: 'Thai Airways' },
  { code: 'CX', name: 'Cathay Pacific' },
  { code: 'JL', name: 'Japan Airlines' },
  { code: 'NH', name: 'ANA' },
  { code: 'KE', name: 'Korean Air' },
  { code: 'OZ', name: 'Asiana Airlines' },
  { code: 'CI', name: 'China Airlines' },
  { code: 'MU', name: 'China Eastern' },
  { code: 'CZ', name: 'China Southern' },
  { code: 'AK', name: 'AirAsia' },
  { code: 'D7', name: 'AirAsia X' },
  { code: 'VJ', name: 'VietJet Air' },
  { code: 'PR', name: 'Philippine Airlines' },
  { code: 'GA', name: 'Garuda Indonesia' },

  // Europe
  { code: 'BA', name: 'British Airways' },
  { code: 'LH', name: 'Lufthansa' },
  { code: 'AF', name: 'Air France' },
  { code: 'KL', name: 'KLM' },
  { code: 'VS', name: 'Virgin Atlantic' },
  { code: 'LX', name: 'Swiss International Air Lines' },
  { code: 'OS', name: 'Austrian Airlines' },
  { code: 'TK', name: 'Turkish Airlines' },
  { code: 'IB', name: 'Iberia' },
  { code: 'AZ', name: 'ITA Airways' },
  { code: 'SK', name: 'SAS' },
  { code: 'FI', name: 'Icelandair' },
  { code: 'FR', name: 'Ryanair' },
  { code: 'U2', name: 'easyJet' },
  { code: 'W6', name: 'Wizz Air' },
  { code: 'LO', name: 'LOT Polish Airlines' },

  // Americas / Oceania / Africa
  { code: 'AA', name: 'American Airlines' },
  { code: 'DL', name: 'Delta Air Lines' },
  { code: 'UA', name: 'United Airlines' },
  { code: 'AC', name: 'Air Canada' },
  { code: 'QF', name: 'Qantas' },
  { code: 'NZ', name: 'Air New Zealand' },
  { code: 'ET', name: 'Ethiopian Airlines' },
  { code: 'MS', name: 'EgyptAir' },
  { code: 'KQ', name: 'Kenya Airways' },
  { code: 'SA', name: 'South African Airways' },

  // Nepal / Sri Lanka / Bangladesh / Central Asia
  { code: 'UL', name: 'SriLankan Airlines' },
  { code: 'BG', name: 'Biman Bangladesh Airlines' },
  { code: 'RA', name: 'Nepal Airlines' },
  { code: 'YT', name: 'Yeti Airlines' },
  { code: 'PK', name: 'Pakistan International Airlines' },
  { code: 'HY', name: 'Uzbekistan Airways' },
]
