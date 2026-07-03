/** Construit une URL d'itinéraire Google Maps à partir d'une adresse. */
export function itineraireUrl(adresse: string, ville = "Besançon"): string {
  const q = encodeURIComponent(`${adresse}, ${ville}`);
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}

/** Formate une date en français long (ex. "12 juin 2026"). */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}
