export const localDate=(d=new Date())=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
export const cleanNumber=v=>typeof v==='string'&&v.trim()===''?NaN:Number(v);
export const clone=x=>structuredClone(x);
export const goals=[['observe','Conocer mi alimentación'],['lose','Bajar de peso'],['fat','Reducir grasa'],['maintain','Mantener peso'],['gain','Subir de peso'],['muscle','Apoyar ganancia muscular'],['recomp','Recomposición corporal'],['custom','Definir mis calorías']];
export function validDate(s){if(!/^\d{4}-\d{2}-\d{2}$/.test(s))return false;const d=new Date(s+'T12:00:00');return Number.isFinite(d.getTime())&&localDate(d)===s}
const fail=message=>{throw Error(message)};
export function energyPlan(f,today=localDate()){
  if(!goals.some(g=>g[0]===f.goal))fail('Elige qué quieres lograr para comenzar.');
  if(f.goal==='observe')return {label:'Conocer mi alimentación',kcal:null,macro:null,warnings:[],canApply:true};
  const age=cleanNumber(f.age),w=cleanNumber(f.weight),h=cleanNumber(f.height),a=cleanNumber(f.activity);
  if(![age,w,h,a].every(Number.isFinite)||!['male','female'].includes(f.sex)||age<18||age>100||w<30||w>350||h<120||h>230||![1.2,1.375,1.55,1.725,1.9].includes(a))fail('Completa edad (18–100), peso (30–350 kg), estatura (120–230 cm), sexo para la fórmula y actividad.');
  if(f.context==='special')fail('La fórmula general no contempla embarazo o lactancia. Puedes usar el diario sin una meta automática.');
  const basal=10*w+6.25*h-5*age+(f.sex==='male'?5:-161),base=basal*a;
  let extra=0;
  if(f.exerciseMode==='separate'){
    const e=cleanNumber(f.exercise),d=cleanNumber(f.exerciseDays),share=cleanNumber(f.exerciseShare);
    if(![e,d,share].every(Number.isFinite)||e<0||e>2500||d<0||d>14||![0,50,100].includes(share))fail('Completa las sesiones adicionales y la parte que quieres incorporar.');
    extra=e*d/7*share/100;
  }
  const expenditure=base+extra;
  const sign=['lose','fat'].includes(f.goal)?-1:['gain','muscle'].includes(f.goal)?1:0;
  const direct=f.goal==='custom'||sign!==0&&f.method==='intake';
  let adjustment=0,days=null,weekly=null,canApply=true;
  if(direct){const target=cleanNumber(f.custom);if(!Number.isFinite(target)||target<=0)fail('Ingresa las calorías totales que quieres consumir por día.');adjustment=target-expenditure;}
  else if(sign){
    if(f.method==='date'){
      const target=cleanNumber(f.targetWeight);
      if(!Number.isFinite(target)||target<30||target>350||!validDate(f.targetDate))fail('Indica un peso deseado válido y una fecha futura.');
      days=(Date.parse(f.targetDate+'T12:00:00Z')-Date.parse(today+'T12:00:00Z'))/86400000;
      if(days<=0||days>3650)fail('Elige una fecha futura dentro de diez años.');
      if((target-w)*sign<=0)fail('El peso deseado va en la dirección contraria al objetivo. Cambia el peso o el objetivo.');
      adjustment=(target-w)*7700/days;
    }else{
      const value=cleanNumber(f.adjust);
      if(!Number.isFinite(value)||value<=0)fail('Elige un ritmo de ejemplo o escribe un ajuste mayor que cero.');
      if(f.method==='kcal')adjustment=sign*value;
      else if(f.method==='percent'){if(value>=100)fail('El ajuste porcentual debe ser menor que 100 %.');adjustment=sign*expenditure*value/100;}
      else if(f.method==='weekly')adjustment=sign*value*7700/7;
      else fail('Elige cómo quieres definir las calorías.');
    }
  }
  const kcal=direct?cleanNumber(f.custom):Math.round(expenditure+adjustment);
  const minimum=f.sex==='male'?1500:1200;
  if(!Number.isFinite(kcal)||kcal<minimum){
    if(!direct&&sign<0)fail(`Este ajuste se resta del gasto estimado (${Math.round(expenditure)} kcal) y dejaría ${Math.round(kcal)} kcal/día, por debajo del mínimo de la app (${minimum}). Reduce el recorte. Si escribiste lo que quieres comer, elige «Calorías totales al día».`);
    fail(`La meta queda por debajo del mínimo de la app (${minimum} kcal/día). Aumenta las calorías o elige registro sin meta.`);
  }
  if(kcal>6000)fail('La meta supera el máximo de este calculador (6.000 kcal/día). Revisa unidades y valores; el diario sin meta sigue disponible.');
  adjustment=kcal-expenditure;
  if(Math.abs(adjustment)>.5)weekly=Math.abs(adjustment)*7/7700;
  const warnings=[];
  if(Math.abs(adjustment)/expenditure>.35)warnings.push('El ajuste supera el 35 % del gasto estimado. Puedes reducirlo y comparar otro escenario antes de aplicar.');
  if(weekly>w*.01)warnings.push('La equivalencia de ritmo supera el 1 % de tu peso por semana. Revisa el ajuste o amplía el plazo; esta equivalencia no predice resultados.');
  if(direct&&sign&&adjustment*sign<0){warnings.push('Estas calorías van en dirección contraria al objetivo elegido. Cambia las calorías o usa esta meta como personalizada.');canApply=false;}
  return {label:goals.find(g=>g[0]===f.goal)[1],kcal,basal,base,extra,expenditure,adjustment,days,weekly,warnings,canApply,direct,minimum};
}
export function computePlan(f,today=localDate()){
  const energy=energyPlan(f,today);
  if(energy.kcal===null)return energy;
  const {kcal}=energy,w=cleanNumber(f.weight);
  let macro;
  if(f.macroMode==='preset'||f.macroMode==='percent'){
    const options={balanced:[25,45,30],protein:[30,40,30],lower:[25,35,40]};
    const ratios=f.macroMode==='preset'?options[f.preset]:[f.p,f.c,f.f].map(cleanNumber);
    if(!ratios||ratios.some(x=>!Number.isFinite(x)||x<=0||x>=100))fail('Elige una distribución o completa los tres porcentajes con valores positivos.');
    const sum=ratios.reduce((a,b)=>a+b,0);
    if(Math.abs(sum-100)>.01)fail(`Los nutrientes suman ${Math.round(sum*100)/100} %. Ajusta el reparto a 100 % o usa «Normalizar a 100 %».`);
    macro=[kcal*ratios[0]/100/4,kcal*ratios[1]/100/4,kcal*ratios[2]/100/9];
  }else if(f.macroMode==='kg'){
    const p=cleanNumber(f.proteinKg),fat=cleanNumber(f.fatKg);
    if(![p,fat].every(Number.isFinite)||p<=0||p>4||fat<=0||fat>3)fail('Completa proteína (hasta 4 g/kg) y grasas (hasta 3 g/kg) con valores positivos.');
    const protein=p*w,grasa=fat*w,carbs=(kcal-protein*4-grasa*9)/4;
    if(carbs<=0)fail('La proteína y las grasas ya consumen toda la energía. Reduce los g/kg o revisa las calorías totales.');
    macro=[protein,carbs,grasa];
  }else if(f.macroMode==='grams'){
    macro=[f.pg,f.fg,f.gg].map(cleanNumber);
    if(macro.some(x=>!Number.isFinite(x)||x<=0))fail('Completa los gramos diarios de proteína, carbohidratos y grasas.');
    const calories=macro[0]*4+macro[1]*4+macro[2]*9;
    if(Math.abs(calories-kcal)>10)fail(`Estos gramos aportan ${Math.round(calories)} kcal y tu meta es ${Math.round(kcal)}. Ajusta carbohidratos o utiliza las calorías de los gramos.`);
  }else fail('Elige un método para distribuir nutrientes.');
  return {...energy,macro,form:clone(f)};
}
