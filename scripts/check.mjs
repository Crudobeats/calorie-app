import {readdir,readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {validateCatalog} from '../public/lib/validation.js';
const root=path.resolve(import.meta.dirname,'..');
async function walk(dir){const result=[];for(const e of await readdir(dir,{withFileTypes:true})){if(e.name.startsWith('.')||e.name==='node_modules')continue;const file=path.join(dir,e.name);if(e.isDirectory())result.push(...await walk(file));else result.push(file)}return result}
const files=await walk(root);for(const file of files.filter(f=>/\.(mjs|js)$/.test(f))){const r=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});if(r.status!==0){console.error(r.stderr);process.exit(1)}}
const catalog=validateCatalog(JSON.parse(await readFile(path.join(root,'public/data/catalog.json'),'utf8')));if(catalog.foods.length<400)throw Error('El catálogo debe contener al menos 400 opciones');const html=await readFile(path.join(root,'public/index.html'),'utf8');if(/<script(?![^>]*src=)[^>]*>/.test(html))throw Error('No deben existir scripts inline');if(files.some(f=>f.endsWith('.dev.vars')))throw Error('No empaquetes secretos');console.log('Sintaxis, catálogo ('+catalog.foods.length+'), estructura y ausencia de scripts inline: OK');
