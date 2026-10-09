// End-to-end API -> production-equivalent exporter -> Astro output. Synthetic DB only.
import assert from 'node:assert/strict';
import { readFile, writeFile, access } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
const base='http://127.0.0.1:3001';
const c=JSON.parse(await readFile('cms/.local/identifiants-locaux.json','utf8'));
const response=await fetch(base+'/api/users/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(c)});
assert.equal(response.status,200);const {token}=await response.json();
async function api(path,method='GET',data) {
  const r=await fetch(base+'/api/'+path,{method,headers:{'Content-Type':'application/json',Authorization:`JWT ${token}`,Origin:base},...(data?{body:JSON.stringify(data)}:{})});
  assert.ok(r.ok,`API ${method} ${path}: ${r.status}`);return r.json();
}
const one=async(collection,slug)=>(await api(`${collection}?where[slug][equals]=${slug}`)).docs[0];
const info=await one('informations','general');assert.equal(info.nomCourt,'MSP fictive','Test interdit sur une base de contenu réel');
const release=()=>new Promise((done,reject)=>{const p=spawn(process.execPath,['scripts/release.mjs'],{stdio:'pipe'});let tail='';p.stdout.on('data',b=>{tail=(tail+b).slice(-1800)});p.stderr.on('data',b=>{tail=(tail+b).slice(-1800)});p.on('exit',c=>c===0?done():reject(Error(tail)));p.on('error',reject);});
const html=path=>readFile('.local/site-current/'+path+'/index.html','utf8');
const record=[];const ok=name=>{record.push(name);console.log('PASS',name);};
const pro=await one('professionnels','camille-exemple');const places=(await api('lieux')).docs;const south=places.find(l=>l.slug==='etablissement-fictif-sud');
const getID=x=>typeof x==='object'?x.id:x;
const restorePro={lieux:pro.lieux.map(getID),horairesParLieu:pro.horairesParLieu.map(x=>({lieu:getID(x.lieu),horaires:x.horaires})),_status:'published'};
let added,news;
let mediaPublic;
try {
  await api('professionnels/'+pro.id,'PATCH',{horairesParLieu:pro.horairesParLieu.map((x,i)=>({lieu:getID(x.lieu),horaires:i===0?'Vendredi 08 h–11 h (TEST A)':x.horaires})),_status:'published'});
  await release();assert.match(await html('equipe/camille-exemple'),/Vendredi 08 h–11 h \(TEST A\)/);ok('A — nouveaux horaires relus dans la page Astro après publication CMS');
  await api('professionnels/'+pro.id,'PATCH',{lieux:[south.id],horairesParLieu:[{lieu:south.id,horaires:'Jeudi 15 h–17 h (TEST B)'}],_status:'published'});
  await release();const main=(await html('equipe/camille-exemple')).split('<main')[1].split('</main>')[0];assert.match(main,/Établissement fictif Sud/);assert.doesNotMatch(main,/Établissement fictif Nord/);assert.match(main,/destination=/);ok('B — nouveau lieu et itinéraire cohérents sur fiche publique');
  const previous=await one('professionnels','recette-publication');const data={slug:'recette-publication',prenom:'Charlie',nom:'Fictif',titreAffiche:'Charlie Fictif (TEST C)',profession:'infirmier',professionLabel:'Infirmier',lieux:[south.id],visible:true,archive:false,_status:'published'};
  added=previous? (await api('professionnels/'+previous.id,'PATCH',data)).doc : (await api('professionnels','POST',data)).doc;
  await release();assert.match(await html('equipe'),/Charlie Fictif \(TEST C\)/);await access('.local/site-current/equipe/recette-publication/index.html');ok('C — nouveau professionnel présent dans annuaire et fiche publique');
  const sharp=createRequire(resolve('cms/package.json'))('sharp');
  const bytes=await sharp({create:{width:2,height:2,channels:3,background:'#0011ff'}}).png().toBuffer();
  const form=new FormData();form.set('_payload',JSON.stringify({alt:'Carré bleu fictif unique',credit:'Image synthétique de recette'}));form.set('file',new Blob([bytes],{type:'image/png'}),'unique-fictive.png');
  const uploaded=await fetch(base+'/api/medias',{method:'POST',headers:{Authorization:`JWT ${token}`,Origin:base},body:form});assert.equal(uploaded.status,201);
  const upload=(await uploaded.json()).doc;
  const original=await one('actualites','prevention-fictive');const oldNews=await one('actualites','recette-publication');const article={slug:'recette-publication',titre:'Prévention fictive TEST D',resume:'Démonstration synthétique de publication complète.',date:new Date().toISOString(),categorie:'Prévention',image:upload.id,visible:true,archive:false,_status:'draft'};
  news=oldNews?(await api('actualites/'+oldNews.id,'PATCH',article)).doc:(await api('actualites','POST',article)).doc;
  await release();await assert.rejects(access('.local/site-current/actualites/recette-publication/index.html'));
  await api('actualites/'+news.id,'PATCH',{_status:'published'});await release();const articleHTML=await html('actualites/recette-publication');assert.match(articleHTML,/Prévention fictive TEST D/);assert.match(articleHTML,/\/media\/[a-f0-9]{64}\.png/);mediaPublic=articleHTML.match(/\/media\/[a-f0-9]{64}\.png/)[0];await access('.local/site-current'+mediaPublic);assert.match(await html('actualites'),/Prévention fictive TEST D/);ok('D — brouillon absent puis actualité avec image présente après publication');
  const version=(await api('actualites/versions?where[parent][equals]='+news.id+'&sort=-updatedAt')).docs.find(v=>v.version._status==='published'&&v.version.titre===article.titre);assert.ok(version);
  await api('actualites/'+news.id,'PATCH',{titre:'Titre temporaire fictif TEST E',_status:'published'});await release();assert.match(await html('actualites/recette-publication'),/Titre temporaire fictif TEST E/);
  await api('actualites/versions/'+version.id+'?draft=true','POST',{});await api('actualites/'+news.id,'PATCH',{_status:'published'});await release();assert.match(await html('actualites/recette-publication'),/Prévention fictive TEST D/);ok('E — version restaurée puis republiée, ancienne valeur relue dans Astro');
  for(const path of ['/api/actualites?draft=true','/api/actualites/versions',upload.url]) {const r=await fetch(new URL(path,base));assert.ok([401,403,404].includes(r.status));}
  assert.doesNotMatch(await html('actualites'),/DRAFT_NEVER_PUBLIC/);ok('F — APIs, versions et image CMS refusées anonymes ; brouillon absent du public');
  await api('actualites/'+news.id,'PATCH',{_status:'draft'});await release();await assert.rejects(access('.local/site-current/actualites/recette-publication/index.html'));await assert.rejects(access('.local/site-current'+mediaPublic));ok('Dépublication — page et image devenue orpheline absentes de la release suivante');
} finally {
  await api('professionnels/'+pro.id,'PATCH',restorePro);
  if(added)await api('professionnels/'+added.id,'PATCH',{archive:true,_status:'published'});
  if(news)await api('actualites/'+news.id,'PATCH',{archive:true,_status:'draft'});
  await release();
}
await writeFile('.local/integration-results.json',JSON.stringify({syntheticOnly:true,results:record},null,2));
