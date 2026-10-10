/** Search and secondary functions share the same public CMS fields everywhere. */
export interface DirectoryProfessional {
  titreAffiche: string;
  profession: string;
  professionLabel: string;
  domaines: string[];
  activites: string[];
}
export const professionLabels: Record<string, string> = {
  'medecin-generaliste': 'Médecin généraliste', infirmier: 'Infirmière',
  kinesitherapeute: 'Kinésithérapeute', pharmacien: 'Pharmacien',
  coordination: 'Coordinatrice', autre: 'Autre profession', 'a-confirmer': 'À confirmer',
};
export const normalizeSearch = (value: string): string => value.normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('fr').replace(/[^a-z0-9]+/g, ' ').trim();
export function professionalRoleIDs(person: DirectoryProfessional): string[] {
  const ids = new Set([person.profession]);
  // A person retains their primary profession and may also coordinate the MSP.
  // This explicit activity is editable in the existing Payload “Activités” list.
  if (person.activites.some(value => ['coordination', 'coordinatrice', 'coordinateur'].includes(normalizeSearch(value)))) ids.add('coordination');
  return [...ids];
}
export function professionalSearchText(person: DirectoryProfessional): string {
  return [person.titreAffiche, person.professionLabel, ...person.domaines, ...person.activites,
    ...professionalRoleIDs(person).map(id => professionLabels[id] || id)].join(' ');
}
export function professionOptions(people: DirectoryProfessional[]): [string, string][] {
  return [...new Set(people.flatMap(professionalRoleIDs))].map(id => [id, professionLabels[id] || id]);
}
export function matchesDirectory(text: string, query: string, roles: string[], selectedRole: string, places: string[], selectedPlace: string): boolean {
  const haystack = normalizeSearch(text);
  return normalizeSearch(query).split(' ').filter(Boolean).every(word => haystack.includes(word))
    && (!selectedRole || roles.includes(selectedRole))
    && (!selectedPlace || places.includes(selectedPlace));
}
