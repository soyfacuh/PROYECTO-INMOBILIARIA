'use strict';
const http=require('http'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const ROOT=__dirname, DATA=path.join(ROOT,'data','database.json'), PORT=Number(process.env.PORT||3000);
const sessions=new Map();
const encode=p=>crypto.scryptSync(p,'verdecasa-user-v1',64).toString('hex');
const initial=()=>({propiedades:require('./seed.js').map(p=>({...p,estado:'publicada'})),usuarios:[{id:1,email:'admin',nombre:'Administrador Demo',hash:encode('soyfacuh'),rol:'propietario'}],consultas:[]});
let db=fs.existsSync(DATA)?JSON.parse(fs.readFileSync(DATA,'utf8')):initial();
function persist(){const tmp=DATA+'.tmp';fs.writeFileSync(tmp,JSON.stringify(db,null,2));fs.renameSync(tmp,DATA)}
if(!fs.existsSync(DATA))persist();
// Credenciales fijas únicamente para demostración local. Nunca publicar este backend sin cambiarlas.
if(process.env.NODE_ENV==='production') console.warn('AVISO: credenciales de demo; NO expongas este servidor públicamente.');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.xml':'application/xml','.txt':'text/plain'};
function send(res,status,obj,headers={}){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',...headers});res.end(JSON.stringify(obj))}
function cookie(req){return (req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('vc_session='))?.split('=')[1]}
function actor(req){const item=sessions.get(cookie(req));if(!item||item.exp<Date.now())return null;return db.usuarios.find(x=>x.id===item.uid)||null}
function input(req){return new Promise((resolve,reject)=>{let data='';req.on('data',c=>{data+=c;if(data.length>4e6){reject(Error('Demasiados datos'));req.destroy()}});req.on('end',()=>{try{resolve(JSON.parse(data||'{}'))}catch{reject(Error('JSON inválido'))}})})}
function prop(x,old={}){const str=k=>String(x[k]??old[k]??'').trim().slice(0,k==='descripcion'?3000:250);const num=k=>Number(x[k]??old[k]??0);const estado=str('estado');const result={...old,titulo:str('titulo'),operacion:str('operacion'),tipo:str('tipo'),zona:str('zona'),ciudad:str('ciudad'),direccion:str('direccion'),descripcion:str('descripcion'),imagen:str('imagen'),precio:num('precio'),moneda:str('moneda'),dormitorios:num('dormitorios'),baños:num('baños'),metros:num('metros'),cochera:Boolean(x.cochera??old.cochera),destacado:Boolean(x.destacado??old.destacado),nueva:Boolean(x.nueva??old.nueva),estado:estado||'borrador'};if(!result.titulo||!['Venta','Alquiler'].includes(result.operacion)||!['ARS','USD'].includes(result.moneda)||!['borrador','publicada','reservada','vendida','alquilada'].includes(result.estado)||!Number.isFinite(result.precio)||result.precio<0||!Number.isFinite(result.metros)||result.metros<0||[result.dormitorios,result.baños].some(n=>!Number.isInteger(n)||n<0))throw Error('Revisá los campos obligatorios y valores numéricos');if(result.imagen&&!(/^https:\/\//i.test(result.imagen)||/^data:image\/(png|jpeg|webp);base64,/i.test(result.imagen)||/^img\//i.test(result.imagen)))throw Error('Imagen no válida');return result}
const rate=new Map();function limited(ip){const now=Date.now(),v=rate.get(ip)||{n:0,t:now};if(now-v.t>60000){v.n=0;v.t=now}v.n++;rate.set(ip,v);return v.n>15}
const server=http.createServer(async(req,res)=>{try{
const url=new URL(req.url,'http://localhost'),route=url.pathname,user=actor(req);
if(route.startsWith('/api/')){
 if(route==='/api/propiedades'&&req.method==='GET')return send(res,200,db.propiedades.filter(p=>p.estado==='publicada'));
 if(route==='/api/setup-status'&&req.method==='GET')return send(res,200,{configured:db.usuarios.length>0});
 if(route==='/api/setup'&&req.method==='POST') {if(db.usuarios.length)return send(res,403,{error:'Ya existe un administrador'});const b=await input(req);if(!String(b.password||'').match(/^.{12,}$/)||!String(b.email||'').includes('@'))return send(res,400,{error:'Usá un correo y una contraseña de al menos 12 caracteres'});db.usuarios.push({id:1,email:String(b.email).toLowerCase(),nombre:String(b.nombre||'Administrador'),hash:encode(b.password),rol:'propietario'});persist();return send(res,201,{ok:true})}
 if(route==='/api/login'&&req.method==='POST'){if(limited(req.socket.remoteAddress))return send(res,429,{error:'Demasiados intentos'});const b=await input(req);const u=db.usuarios.find(u=>u.email===String(b.email||'').toLowerCase() || (String(b.email||'').toLowerCase()==='admin' && u.email==='admin'));if(!u||u.hash!==encode(String(b.password||'')))return send(res,401,{error:'Credenciales incorrectas'});const tok=crypto.randomBytes(32).toString('hex');sessions.set(tok,{uid:u.id,exp:Date.now()+86400000});return send(res,200,{ok:true}, {'Set-Cookie':`vc_session=${tok}; HttpOnly; SameSite=Strict; Path=/; Max-Age=86400${process.env.NODE_ENV==='production'?'; Secure':''}`})}
 if(route==='/api/logout'&&req.method==='POST'){sessions.delete(cookie(req));return send(res,200,{ok:true},{'Set-Cookie':'vc_session=; Path=/; HttpOnly; Max-Age=0'})}
 if(route==='/api/consultas'&&req.method==='POST'){if(limited(req.socket.remoteAddress))return send(res,429,{error:'Muchas consultas'});const b=await input(req);if(!String(b.nombre||'').trim()||!String(b.contacto||'').trim())return send(res,400,{error:'Nombre y contacto requeridos'});db.consultas.unshift({id:crypto.randomUUID(),fecha:new Date().toISOString(),nombre:String(b.nombre).slice(0,100),contacto:String(b.contacto).slice(0,120),mensaje:String(b.mensaje||'').slice(0,1000),propiedadId:Number(b.propiedadId||0),presupuesto:Number(b.presupuesto||0)});persist();return send(res,201,{ok:true})}
 if(!user)return send(res,401,{error:'Iniciá sesión'});
 if(route==='/api/me'&&req.method==='GET')return send(res,200,{nombre:user.nombre,rol:user.rol,email:user.email});
 if(route==='/api/admin/propiedades'&&req.method==='GET')return send(res,200,db.propiedades);
 if(route==='/api/admin/consultas'&&req.method==='GET')return send(res,200,db.consultas);
 if(route==='/api/admin/usuarios'&&req.method==='GET')return send(res,200,db.usuarios.map(({hash,...rest})=>rest));
 if(route==='/api/admin/usuarios'&&req.method==='POST'){if(user.rol!=='propietario')return send(res,403,{error:'Solo el propietario puede crear usuarios'});const b=await input(req);const email=String(b.email||'').toLowerCase().trim();if(!email.includes('@')||String(b.password||'').length<12||db.usuarios.some(u=>u.email===email))return send(res,400,{error:'Correo duplicado o contraseña de menos de 12 caracteres'});db.usuarios.push({id:Math.max(...db.usuarios.map(u=>u.id))+1,email,nombre:String(b.nombre||'Agente').slice(0,80),hash:encode(b.password),rol:'editor'});persist();return send(res,201,{ok:true})}
 if(route==='/api/admin/propiedades'&&req.method==='POST'){const b=await input(req),newp={...prop(b),id:Math.max(0,...db.propiedades.map(p=>p.id))+1};db.propiedades.unshift(newp);persist();return send(res,201,newp)}
 const m=route.match(/^\/api\/admin\/propiedades\/(\d+)$/);
 if(m){const id=Number(m[1]),idx=db.propiedades.findIndex(p=>p.id===id);if(idx<0)return send(res,404,{error:'Propiedad no encontrada'});if(req.method==='PUT'){db.propiedades[idx]={...prop(await input(req),db.propiedades[idx]),id};persist();return send(res,200,db.propiedades[idx])}if(req.method==='DELETE'){db.propiedades.splice(idx,1);persist();return send(res,200,{ok:true})}}
 return send(res,404,{error:'Ruta no encontrada'});
 }
 let pathname=decodeURIComponent(route==='/'?'/index.html':route);if(pathname.includes('\\')||pathname.split('/').includes('..')||pathname.startsWith('/data/')||['/server.js','/seed.js','/package.json','/README.md'].includes(pathname))return send(res,404,{error:'No encontrado'});
 const file=path.resolve(ROOT,'.'+pathname);if(!file.startsWith(ROOT+path.sep))return send(res,403,{error:'No autorizado'});let stat;try{stat=fs.statSync(file)}catch{return send(res,404,{error:'No encontrado'})}if(!stat.isFile())return send(res,404,{error:'No encontrado'});res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','X-Content-Type-Options':'nosniff'});fs.createReadStream(file).pipe(res);
}catch(e){send(res,400,{error:e.message||'Error'})}});
server.listen(PORT,()=>console.log(`Verde Casa disponible en http://localhost:${PORT}`));
