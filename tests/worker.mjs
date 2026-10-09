import { testCMSURL, testCredentials } from './helpers/runtime.mjs';
import { spawn } from 'node:child_process';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const base=testCMSURL;const credentials=await testCredentials();
const auth=await fetch(base+'/api/users/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(credentials)});const {token}=await auth.json();
const headers={'content-type':'application/json',Authorization:`JWT ${token}`,Origin:base};
const fetchDoc=async(slug)=>(await (await fetch(`${base}/api/${slug}`,{headers})).json()).docs[0];
assert.equal((await fetchDoc('informations')).nomCourt,'MSP fictive');
const doc=await fetchDoc('actualites?where[slug][equals]=prevention-fictive');
const update=async resume=>{const r=await fetch(base+'/api/actualites/'+doc.id,{method:'PATCH',headers,body:JSON.stringify({resume,_status:'published'})});assert.equal(r.status,200);};
const worker=spawn(process.execPath,['scripts/watch-publication.mjs'],{stdio:'pipe'});let output='';worker.stdout.on('data',b=>output+=b);worker.stderr.on('data',()=>{});
const start=Date.now();const before=(await readdir('.releases')).length;
try {
  while(!output.includes('Aucun changement')){assert.ok(Date.now()-start<20_000,'Premier cycle du worker');await new Promise(r=>setTimeout(r,300));}
  assert.equal((await readdir('.releases')).length,before,'Aucune release ajoutée sans changement');
  const mark='Publication automatique fictive — vérification du cycle';await update(mark);
  while(!(await readFile('.local/site-current/actualites/index.html','utf8')).includes(mark)){assert.ok(Date.now()-start<95_000,'Cycle automatique requis');await new Promise(r=>setTimeout(r,1000));}
  const elapsed=Math.round((Date.now()-start)/1000);console.log(`PASS publication automatique observée après ${elapsed}s; aucun build à vide.`);
  await writeFile('.local/worker-results.json',JSON.stringify({syntheticOnly:true,passed:true,seconds:elapsed,noReleaseWhenUnchanged:true},null,2));
} finally {
  worker.kill('SIGTERM');await update(doc.resume);
  await new Promise((done,reject)=>{const p=spawn(process.execPath,['scripts/release.mjs'],{stdio:'ignore'});p.on('exit',c=>c===0?done():reject(Error('Restauration de fixture refusée')));});
}
