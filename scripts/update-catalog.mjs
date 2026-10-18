import {readFile} from 'node:fs/promises';
import {validateCatalog} from '../public/lib/validation.js';
const [origin,file]=process.argv.slice(2);
if(!origin||!file){console.error('Uso: node scripts/update-catalog.mjs https://tu-dominio catalogo.json');process.exit(1)}
const url=new URL('/api/catalog',origin);if(url.protocol!=='https:'&&url.hostname!=='127.0.0.1'&&url.hostname!=='localhost')throw Error('Se requiere HTTPS');
const token=process.env.CATALOG_ADMIN_TOKEN;if(!token||token.length<32)throw Error('Configura CATALOG_ADMIN_TOKEN de al menos 32 caracteres en el entorno; nunca en el código.');
const next=validateCatalog(JSON.parse(await readFile(file,'utf8')));const current=await fetch(url,{signal:AbortSignal.timeout(15000)});if(!current.ok)throw Error('No se pudo descargar la revisión actual');const prior=await current.json();if(!prior.etag)throw Error('El servidor no entrega una revisión compatible');const response=await fetch(url,{method:'PUT',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token,'If-Match':prior.etag},body:JSON.stringify(next),signal:AbortSignal.timeout(15000)});const result=await response.json();if(!response.ok)throw Error(result.error||'No se pudo actualizar');console.log('Catálogo actualizado:',result.revision,'· alimentos:',result.count);
