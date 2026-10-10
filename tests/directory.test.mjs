import test from 'node:test';
import assert from 'node:assert/strict';
import { professionalRoleIDs, professionalSearchText, professionOptions, matchesDirectory } from '../src/lib/directory.ts';
const nurse = { titreAffiche: 'Camille Exemple', profession: 'infirmier', professionLabel: 'Infirmière', domaines: ['Nutrition', 'Éducation thérapeutique'], activites: ['Coordination'] };
const doctor = { titreAffiche: 'Alex Exemple', profession: 'medecin-generaliste', professionLabel: 'Médecin généraliste', domaines: ['Pédiatrie', 'Visites à domicile'], activites: [] };
test('one person is found under their profession and their secondary coordination function', () => {
  const roles = professionalRoleIDs(nurse);
  for (const role of ['infirmier', 'coordination']) assert.ok(matchesDirectory(professionalSearchText(nurse), '', roles, role, ['site-fictif'], 'site-fictif'));
  assert.ok(!matchesDirectory(professionalSearchText(nurse), '', roles, 'pharmacien', ['site-fictif'], ''));
  assert.equal(professionOptions([nurse, { ...nurse, activites: [] }]).filter(([id]) => id === 'infirmier').length, 1);
});
test('skills are searchable with accents, punctuation and independently ordered words', () => {
  const text = professionalSearchText(doctor);
  for (const q of ['pediatrie', 'PÉDIATRIE', 'domicile alex', 'visites-à-domicile', '']) assert.ok(matchesDirectory(text, q, professionalRoleIDs(doctor), '', ['site-fictif'], ''), q);
  assert.ok(!matchesDirectory(text, 'pediatrie nutrition', professionalRoleIDs(doctor), '', ['site-fictif'], ''));
  assert.ok(!matchesDirectory(text, 'pediatrie', professionalRoleIDs(doctor), '', ['site-fictif'], 'autre-site'));
  assert.ok(matchesDirectory(professionalSearchText(nurse), 'coordinatrice', professionalRoleIDs(nurse), '', [], ''));
});
