// Known cancel / signup URLs for common streaming services, so we can
// auto-fill a cancel link when the user didn't enter one, and offer a
// reactivation link for the next service in their rotation.

interface CatalogEntry {
  cancel: string;
  signup: string;
}

// Keyed by a normalized service name (lowercase, alphanumeric only).
const CATALOG: Record<string, CatalogEntry> = {
  netflix: { cancel: 'https://www.netflix.com/cancelplan', signup: 'https://www.netflix.com/signup' },
  hulu: { cancel: 'https://secure.hulu.com/account/cancel', signup: 'https://www.hulu.com/welcome' },
  disney: { cancel: 'https://www.disneyplus.com/account/subscription', signup: 'https://www.disneyplus.com/sign-up' },
  disneyplus: { cancel: 'https://www.disneyplus.com/account/subscription', signup: 'https://www.disneyplus.com/sign-up' },
  max: { cancel: 'https://www.max.com/account', signup: 'https://www.max.com/subscribe' },
  hbomax: { cancel: 'https://www.max.com/account', signup: 'https://www.max.com/subscribe' },
  hbo: { cancel: 'https://www.max.com/account', signup: 'https://www.max.com/subscribe' },
  appletv: { cancel: 'https://tv.apple.com/settings/subscription', signup: 'https://tv.apple.com' },
  appletvplus: { cancel: 'https://tv.apple.com/settings/subscription', signup: 'https://tv.apple.com' },
  amazonprimevideo: { cancel: 'https://www.amazon.com/gp/video/settings', signup: 'https://www.amazon.com/gp/video/signup' },
  amazonprime: { cancel: 'https://www.amazon.com/gp/primecentral', signup: 'https://www.amazon.com/amazonprime' },
  primevideo: { cancel: 'https://www.amazon.com/gp/video/settings', signup: 'https://www.amazon.com/gp/video/signup' },
  prime: { cancel: 'https://www.amazon.com/gp/primecentral', signup: 'https://www.amazon.com/amazonprime' },
  peacock: { cancel: 'https://www.peacocktv.com/account/plans', signup: 'https://www.peacocktv.com' },
  paramountplus: { cancel: 'https://www.paramountplus.com/account/', signup: 'https://www.paramountplus.com' },
  paramount: { cancel: 'https://www.paramountplus.com/account/', signup: 'https://www.paramountplus.com' },
  starz: { cancel: 'https://www.starz.com/us/en/account', signup: 'https://www.starz.com' },
  showtime: { cancel: 'https://www.sho.com/account', signup: 'https://www.sho.com' },
  espnplus: { cancel: 'https://www.espn.com/watch/account', signup: 'https://plus.espn.com' },
  espn: { cancel: 'https://www.espn.com/watch/account', signup: 'https://plus.espn.com' },
  youtubetv: { cancel: 'https://tv.youtube.com/settings/membership', signup: 'https://tv.youtube.com' },
  amcplus: { cancel: 'https://www.amcplus.com/account', signup: 'https://www.amcplus.com' },
  amc: { cancel: 'https://www.amcplus.com/account', signup: 'https://www.amcplus.com' },
  crunchyroll: { cancel: 'https://www.crunchyroll.com/account/membership', signup: 'https://www.crunchyroll.com' },
  discoveryplus: { cancel: 'https://www.discoveryplus.com/account', signup: 'https://www.discoveryplus.com' },
  fubo: { cancel: 'https://www.fubo.tv/account', signup: 'https://www.fubo.tv' },
  fubotv: { cancel: 'https://www.fubo.tv/account', signup: 'https://www.fubo.tv' },
  sling: { cancel: 'https://www.sling.com/account', signup: 'https://www.sling.com' },
  britbox: { cancel: 'https://www.britbox.com/account', signup: 'https://www.britbox.com' },
  mubi: { cancel: 'https://mubi.com/account', signup: 'https://mubi.com' },
};

function normalize(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function catalogCancelUrl(name: string): string | null {
  return CATALOG[normalize(name)]?.cancel ?? null;
}

export function catalogSignupUrl(name: string): string | null {
  return CATALOG[normalize(name)]?.signup ?? null;
}
