import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
const root = resolve(process.argv[2] || '.local/site-current');
const base = (process.env.SERVE_BASE || '/').replace(/\/$/, '');
const mime = {'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.woff2':'font/woff2','.xml':'application/xml','.txt':'text/plain'};
const server = createServer(async (req,res) => {
  try {
    const requested = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (base && requested !== base && !requested.startsWith(base + '/')) throw new Error('Forbidden');
    const pathname = requested.slice(base.length) || '/';
    if (pathname.split('/').some(p=>p.startsWith('.'))) throw new Error('Forbidden');
    let file = resolve(root, `.${pathname}`);
    if (!file.startsWith(root + sep) && file !== root) throw new Error('Forbidden');
    if ((await stat(file)).isDirectory()) file = resolve(file,'index.html');
    res.setHeader('Content-Type',mime[extname(file)] || 'application/octet-stream');
    res.setHeader('Cache-Control','no-store');
    res.setHeader('X-Content-Type-Options','nosniff');
    res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://data.geopf.fr; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'");
    res.end(await readFile(file));
  } catch {res.statusCode=404;res.end('Page introuvable');}
});
server.listen(Number(process.env.PORT || 4321),'127.0.0.1',()=>console.log(`Aperçu local : http://127.0.0.1:${process.env.PORT || 4321}${base}/`));
