/** Construit une URL d'itinéraire Google Maps à partir d'une adresse. */
export function itineraireUrl(adresse: string, ville = "Besançon"): string {
  const q = encodeURIComponent(`${adresse}, ${ville}`);
  return `https://www.google.com/maps/dir/?api=1&destination=${q}`;
}

/** Formate une date en français long (ex. "12 juin 2026"). */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

/** Date et heure d’un événement, toujours dans le fuseau de la MSP. */
export function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat('fr-FR', { dateStyle:'long', timeStyle:'short', timeZone:'Europe/Paris' }).format(date);
}
