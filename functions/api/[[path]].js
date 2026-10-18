// Pages keeps the public origin; a Service Binding forwards API calls to the Worker.
// Provider secrets, rate limiting and Durable Object quota remain in that Worker.
const response=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
export async function onRequest({request,env}){
 const path=new URL(request.url).pathname;
 if(!['/api/config','/api/catalog','/api/recognize'].includes(path))return response({error:'Ruta no encontrada'},404);
 if(!env.AI_BACKEND?.fetch){
  if(path==='/api/config'&&request.method==='GET')return response({aiEnabled:false,turnstileSiteKey:null,status:'backend_missing',message:'El sitio todavía no está conectado al servidor de reconocimiento. El administrador debe configurar el servicio en Cloudflare.',version:'4.3.0'});
  return response({error:'El servidor de reconocimiento no está conectado. Puedes buscar o registrar el alimento manualmente.'},503);
 }
 try{return await env.AI_BACKEND.fetch(request)}catch{return response({error:'No se pudo conectar con el servidor de reconocimiento. Intenta nuevamente.'},503)}
}
