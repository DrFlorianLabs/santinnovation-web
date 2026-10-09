export interface NavItem {
  label: string;
  href: string;
}

/** Navigation principale (header). */
export const mainNav: NavItem[] = [
  { label: "Actualités", href: "/#actualites" },
  { label: "L'équipe", href: "/#equipe" },
  { label: "Les lieux", href: "/#lieux" },
  { label: "Soins et parcours", href: "/#soins-et-parcours" },
  { label: "Projet de santé", href: "/#projet-de-sante" },
  { label: "Recherche & innovation", href: "/#recherche-innovation" },
];

/** Liens secondaires (footer). */
export const footerNav: NavItem[] = [
  { label: "Prendre rendez-vous", href: "/#rendez-vous" },
  { label: "Informations pratiques", href: "/#lieux" },
  { label: "Rejoindre la MSP", href: "/rejoindre" },
  { label: "Contact", href: "/#contact" },
];

/** Liens légaux (footer bas). */
export const legalNav: NavItem[] = [
  { label: "Mentions légales", href: "/mentions-legales" },
  { label: "Confidentialité", href: "/confidentialite" },
  { label: "Accessibilité", href: "/accessibilite" },
];
