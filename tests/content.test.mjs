import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanHTML, projectContent } from '../scripts/project-content.mjs';
const doc = (slug, extra={}) => ({slug,_status:'published',visible:true,archive:false,...extra});
const fixture = () => ({
  professionnels:[doc('medecin-test',{prenom:'Camille',nom:'Exemple',titreAffiche:'Dr Camille Exemple',profession:'medecin-generaliste',professionLabel:'Médecin généraliste',lieux:[{slug:'lieu-test'}],horairesParLieu:[{lieu:{slug:'lieu-test'},horaires:'Lundi 09–12'}]})],
  lieux:[doc('lieu-test',{nom:'Cabinet fictif',adresse:'1 rue fictive',codePostal:'25000',ville:'Ville exemple',coordonneesVerifiees:true})],
  actualites:[doc('prevention-test',{titre:'Prévention fictive',resume:'Texte synthétique',date:'2026-10-09',bodyHtml:'<p>Test</p>'})],pages:['mentions-legales','confidentialite','accessibilite'].map(slug=>doc(slug,{titre:'Texte fictif',validationLegale:true})),activites:[],innovations:[],partenaires:[],
  informations:[doc('general',{nom:'MSP Démonstration',doctolibUrl:'https://www.doctolib.fr/',contactsVerifies:false,contact:{general:'private@example.test'},email:'private@example.test'})],
});
test('only published active content and public fields leave the CMS',()=>{
  const input=fixture();input.actualites.push(doc('draft',{_status:'draft',bodyHtml:'DRAFT_SECRET'}),doc('archive',{archive:true}),doc('hidden',{visible:false}),doc('future',{debutAffichage:'2100-01-01'}),doc('past',{finAffichage:'2000-01-01'}));
  input.actualites[0].privateNote='PRIVATE';input.actualites[0].versions=['SECRET'];
  const result=projectContent(input);assert.equal(result.actualites.length,1);assert.equal(result.site.contact.general,'');assert.doesNotMatch(JSON.stringify(result),/SECRET|PRIVATE|private@example/);
});
test('relations are centralized and orphan publication fails',()=>{
  const f=fixture();const o=projectContent(f);assert.deepEqual(o.professionnels[0].lieux,['lieu-test']);assert.equal(o.professionnels[0].horairesParLieu[0].horaires,'Lundi 09–12');
  f.lieux[0]._status='draft';assert.throws(()=>projectContent(f),/Lieu absent/);
});
test('unsafe content, private media and executable links never reach rich text',()=>{
  const html=cleanHTML('<script>alert(1)</script><img src="/api/media/file/private.jpg"><a href="javascript:alert(1)" onclick="bad()">X</a><a href="//evil.test">Y</a><iframe src="evil"></iframe><p>Texte <strong>lisible</strong></p>');
  assert.doesNotMatch(html,/script|javascript|onclick|iframe|img|\/api\/media|evil/);assert.match(html,/<strong>lisible/);
});
test('duplicate or path traversal slug rejected',()=>{
  const f=fixture();f.actualites[0].slug='../../secret';assert.throws(()=>projectContent(f),/Identifiant/);
  f.actualites=[doc('same'),doc('same')];assert.throws(()=>projectContent(f),/doublon/);
});
test('changed address recomputes directions and ignores stale route',()=>{
  const f=fixture();f.lieux[0].adresse='2 adresse modifiée';f.lieux[0].itineraireUrl='https://www.google.com/maps/old';
  assert.match(projectContent(f).lieux[0].itineraireUrl,/2%20adresse/);
});
test('display windows use UTC boundaries, end is exclusive',()=>{
  const f=fixture();f.actualites[0].debutAffichage='2026-10-09T08:00:00Z';f.actualites[0].finAffichage='2026-10-09T09:00:00Z';
  assert.equal(projectContent(f,new Date('2026-10-09T08:00:00Z')).actualites.length,1);
  assert.equal(projectContent(f,new Date('2026-10-09T09:00:00Z')).actualites.length,0);
});

test('global external links and logos reject executable URLs',()=>{
  const f=fixture();f.partenaires=[doc('bad',{nom:'Partenaire fictif',url:'javascript:alert(1)'})];assert.throws(()=>projectContent(f));
  f.partenaires=[];f.informations[0].liens=[{libelle:'Lien',url:'data:text/html,test'}];assert.throws(()=>projectContent(f));
});

test('missing legal approval blocks complete publication, never falls back to historical text',()=>{
  const f=fixture();f.pages[0].validationLegale=false;assert.throws(()=>projectContent(f),/réglementaire/);
});
