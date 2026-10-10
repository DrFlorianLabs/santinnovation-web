import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile, symlink, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { validateApprovedContent, readApprovedContent, legalPages, approvedPublicAssets, validateApprovedPublicAssets } from '../scripts/validate-approved-content.mjs';

const fixture = () => ({
  professionnels: [{ id: 'camille-exemple', prenom: 'Camille', nom: 'Exemple', titreAffiche: 'Dr Camille Exemple', profession: 'medecin-generaliste', professionLabel: 'Médecin généraliste', lieux: ['cabinet-fictif'], horairesParLieu: [{ lieu: 'cabinet-fictif', horaires: 'Horaire synthétique' }] }],
  lieux: [{ id: 'cabinet-fictif', nom: 'Cabinet fictif', adresse: '1 rue synthétique', codePostal: '25000', ville: 'Ville fictive', adresseVerifiee: false }],
  actualites: [], activites: [], innovations: [], partenaires: [],
  pages: legalPages.map(id => ({ id, titre: 'Information fictive', resume: 'Recette synthétique', bodyHtml: '<p>Prototype de test. Informations réglementaires à compléter avant le site définitif.</p>' })),
  site: { nom: 'MSP fictive', nomCourt: 'MSP fictive', baseline: '', description: '', url: 'https://example.test', ville: 'Ville fictive', secteurs: [], contactsVerifies: false, telephone: '', adresse: '', horaires: '', liens: [], contact: { general: '', secretariat: '', coordination: '' } },
  doctolib: { etablissement: '' },
});
test('approved projection accepts only public fields without imposing roster counts', () => {
  const data = validateApprovedContent(fixture());
  assert.equal(data.professionnels.length, 1); assert.equal(data.lieux.length, 1);
  assert.equal(data.professionnels[0].visible, true);
  assert.deepEqual(data.professionnels[0].lieux, ['cabinet-fictif']);
});
test('private fields, CMS state, drafts and publication windows cannot enter an approved snapshot', () => {
  for (const bad of [{ _status: 'published' }, { _status: 'draft' }, { draft: true }, { archive: true }, { visible: false }, { debutAffichage: '2100-01-01' }, { finAffichage: '2000-01-01' }, { versions: [] }, { password: 'SYNTHETIC_ONLY' }, { notes: 'INTERNAL_TEST' }]) {
    const input = fixture(); Object.assign(input.professionnels[0], bad);
    assert.throws(() => validateApprovedContent(input), /hors contrat/);
  }
  const input = fixture(); input.pages[0].bodyHtml = '<p>DRAFT_NEVER_PUBLIC</p>';
  assert.throws(() => validateApprovedContent(input));
});
test('unknown collections, paths and non-approved media fail closed', () => {
  const input = fixture(); input.informations = []; assert.throws(() => validateApprovedContent(input));
  for (const id of ['../secret', 'pro', 'cms', 'admin', 'api']) {
    const data = fixture(); data.lieux[0].id = id; assert.throws(() => validateApprovedContent(data));
  }
  for (const field of ['photo', 'image', 'logo']) {
    const data = fixture(); data.professionnels[0][field] = '/media/' + 'a'.repeat(64) + '.png'; assert.throws(() => validateApprovedContent(data));
  }
  const data = fixture(); data.lieux[0].photos = [{ image: '/api/medias/file/test.png' }]; assert.throws(() => validateApprovedContent(data));
});
test('relations and duplicate identifiers must remain coherent', () => {
  for (const change of [d => d.lieux.splice(0), d => d.professionnels[0].lieux.push('missing'), d => d.professionnels[0].horairesParLieu[0].lieu = 'missing', d => d.lieux.push({ ...d.lieux[0] })]) {
    const data = fixture(); change(data); assert.throws(() => validateApprovedContent(data));
  }
});
test('rich text is sanitized while preserving readable safe content', () => {
  const data = fixture(); data.pages[0].bodyHtml += '<script>INJECTED</script><iframe src="https://example.test"></iframe><img src="/api/medias/file/private.png"><p onclick="bad()">Texte <strong>lisible</strong><a href="javascript:alert(1)">suite</a><a href="https://example.test/">lien</a></p>';
  const html = validateApprovedContent(data).pages[0].bodyHtml;
  assert.doesNotMatch(html, /INJECTED|script|iframe|<img|onclick|javascript|\/api/);
  assert.match(html, /<strong>lisible<\/strong>/); assert.match(html, /href="https:\/\/example.test\/"/);
});
test('external URLs reject credentials, private endpoints and unsafe protocols, including rich text', () => {
  for (const url of ['javascript:alert(1)', 'https://user:password@example.test/', 'https://localhost/test', 'https://127.0.0.1/test', 'https://example.test/admin', 'https://example.test/%61pi/medias', 'https://example.test/?token=SYNTHETIC']) {
    const data = fixture(); data.partenaires = [{ nom: 'Fictif', url }]; assert.throws(() => validateApprovedContent(data));
    if (url.startsWith('https:')) { const rich = fixture(); rich.pages[0].bodyHtml += `<a href="${url}">Test</a>`; assert.throws(() => validateApprovedContent(rich)); }
  }
});
test('legal placeholders never become a validated production publication', () => {
  const missing = fixture(); missing.pages.pop(); assert.throws(() => validateApprovedContent(missing));
  const historic = fixture(); historic.pages[0].bodyHtml = '<p>[À COMPLÉTER : éditeur]</p>'; assert.throws(() => validateApprovedContent(historic));
  const misleading = fixture(); misleading.pages[0].validationLegale = true; assert.throws(() => validateApprovedContent(misleading));
  const noWarning = fixture(); noWarning.pages[0].bodyHtml = '<p>Texte réglementaire sans contexte.</p>'; assert.throws(() => validateApprovedContent(noWarning));
});
test('general contacts and appointment domains retain their explicit checks', () => {
  const data = fixture(); data.site.contact.general = 'synthetic@example.test'; assert.throws(() => validateApprovedContent(data));
  data.site.contactsVerifies = true; assert.doesNotThrow(() => validateApprovedContent(data));
  data.doctolib.etablissement = 'https://example.test'; assert.throws(() => validateApprovedContent(data));
});
test('snapshot directory refuses extra files, subdirectories and symlinks', async () => {
  const temp = await mkdtemp(join(tmpdir(), 'approved-synthetic-'));
  try {
    const directory = join(temp, 'content'); await mkdir(directory);
    for (const [name, value] of Object.entries(fixture())) await writeFile(join(directory, `${name}.json`), JSON.stringify(value));
    assert.equal((await readApprovedContent(directory)).professionnels.length, 1);
    await writeFile(join(directory, 'secret'), 'SYNTHETIC'); await assert.rejects(readApprovedContent(directory)); await rm(join(directory, 'secret'));
    await mkdir(join(directory, 'media')); await assert.rejects(readApprovedContent(directory)); await rm(join(directory, 'media'), { recursive: true });
    await rm(join(directory, 'site.json')); await writeFile(join(temp, 'site.json'), JSON.stringify(fixture().site));
    await symlink(join(temp, 'site.json'), join(directory, 'site.json')); await assert.rejects(readApprovedContent(directory));
    await symlink(directory, join(temp, 'linked')); await assert.rejects(readApprovedContent(join(temp, 'linked')));
  } finally { await rm(temp, { recursive: true, force: true }); }
});
test('only explicitly approved static assets can be copied by Astro', async () => {
  const temp = await mkdtemp(join(tmpdir(), 'approved-assets-synthetic-'));
  try {
    await mkdir(join(temp, 'brand'));
    for (const asset of approvedPublicAssets) await writeFile(join(temp, asset), 'SYNTHETIC_ASSET');
    await validateApprovedPublicAssets(temp);
    await writeFile(join(temp, 'private-photo.png'), 'SYNTHETIC_UNAPPROVED_IMAGE'); await assert.rejects(validateApprovedPublicAssets(temp)); await rm(join(temp, 'private-photo.png'));
    await mkdir(join(temp, 'pro')); await assert.rejects(validateApprovedPublicAssets(temp)); await rm(join(temp, 'pro'), { recursive: true });
    await rm(join(temp, 'favicon.svg')); await symlink(join(temp, 'brand/symbole.svg'), join(temp, 'favicon.svg')); await assert.rejects(validateApprovedPublicAssets(temp));
  } finally { await rm(temp, { recursive: true, force: true }); }
});
