import { editorialSettings } from "@lib/editorial-settings";
/**
 * Liens Doctolib. La fiche établissement est le point d'entrée principal.
 * Les liens individuels vivent dans la collection "professionnels".
 */
const fallbackDoctolib = {
  etablissement:
    "https://www.doctolib.fr/maison-de-sante/besancon/msp-sant-innovation?pid=practice-782230",
} as const;

export const doctolib = editorialSettings("doctolib", fallbackDoctolib);
