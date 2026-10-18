import {readFile,writeFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url),read=async p=>JSON.parse(await readFile(new URL(p,root),'utf8'));
const sources=await read('data/nutrition/source-foods.json'),mapping=await read('data/nutrition/mapping.json'),catalog=await read('public/data/catalog.json');
const keys=['kcal','protein','carbs','fat','fiber','sugars','saturatedFat','sodium'];
for(const f of catalog.foods){const m=mapping[f.id];if(!m)throw Error('Falta mapeo: '+f.id);Object.assign(f,m);const factor=m.basis==='ml'?m.volumeConversion.gramsPerMl:1;const values=keys.map(k=>m.provenance.components.some(c=>sources[c.fdcId].nutrients[k]==null)?null:Math.round(m.provenance.components.reduce((s,c)=>s+sources[c.fdcId].nutrients[k]*c.gramsPer100g/100,0)*factor*1000)/1000);if(values.slice(0,4).some(v=>v===null))throw Error('Faltan macronutrientes: '+f.id);f.nutrition=values.slice(0,4);f.details=Object.fromEntries(keys.slice(4).map((k,i)=>[k,values[i+4]]));}
await writeFile(new URL('public/data/catalog.json',root),JSON.stringify(catalog,null,2)+'\n');console.log('Recalculadas '+catalog.foods.length+' fichas desde fuentes y fórmulas incluidas.');
