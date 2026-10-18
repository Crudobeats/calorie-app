import http from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import worker from '../server/worker.js';
const root=path.resolve(import.meta.dirname,'../public');
const types={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png'};
const ASSETS={async fetch(req){let pathname;try{pathname=decodeURIComponent(new URL(req.url).pathname)}catch{return new Response('Ruta inválida',{status:400})}const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));if(!file.startsWith(root+path.sep))return new Response('Prohibido',{status:403});try{return new Response(await readFile(file),{headers:{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'}})}catch{return new Response('No encontrado',{status:404})}}};
// Local preview deliberately disables AI. Use Wrangler and server secrets for real integration.
const server=http.createServer(async(req,res)=>{try{const url='http://127.0.0.1:5173'+req.url;const headers=new Headers(req.headers);const init={method:req.method,headers};if(!['GET','HEAD'].includes(req.method)){init.body=req;init.duplex='half'}const response=await worker.fetch(new Request(url,init),{ASSETS,AI_ENABLED:'false'});res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()))}catch{res.writeHead(500,{'Content-Type':'text/plain'});res.end('No se pudo completar la solicitud')}});
server.listen(5173,'127.0.0.1',()=>console.log('CalorieApp: http://127.0.0.1:5173 · IA desactivada en vista local. Ctrl+C para cerrar.'));
