(()=>{
  'use strict';
  const $=id=>document.getElementById(id);
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt=(n,m='USD')=>`${m} ${Number(n||0).toLocaleString('es-AR')}`;
  let props=[], me=null;

  const demoLeads = [
    {fecha:Date.now()-86400000*2,nombre:'Luciana Torres',contacto:'11-1111-1111',presupuesto:165000,mensaje:'Busco departamento de 2 dormitorios en venta, zona Caballito o Villa Crespo.',propiedadId:9},
    {fecha:Date.now()-86400000*4,nombre:'Marcos Ibarra',contacto:'marcos@test.com',presupuesto:1200,mensaje:'Necesito alquiler en Palermo o Belgrano, con balcón y cochera.',propiedadId:3},
    {fecha:Date.now()-86400000*6,nombre:'Sofía Pereyra',contacto:'11-2222-2222',presupuesto:290000,mensaje:'Me interesa una casa en Canning o San Isidro con jardín y 3 dormitorios.',propiedadId:13}
  ];
  const demoTeam = [
    {nombre:'Administrador Demo',email:'admin',rol:'propietario'},
    {nombre:'Valentina Ruiz',email:'valentina@verdecasa.test',rol:'editor'},
    {nombre:'Martín Álvarez',email:'martin@verdecasa.test',rol:'editor'}
  ];

  function note(s){
    $('notice').textContent=s;
    $('notice').classList.add('show');
    clearTimeout(note._t);
    note._t=setTimeout(()=>$('notice').classList.remove('show'),3600);
  }
  function demoAlert(){
    alert('Esta es una versión demo. Las funciones de edición, creación y eliminación están deshabilitadas.\n\nSi querés la versión completa, visitá Soyfacuh.com.');
    note('Versión demo: acción bloqueada');
  }
  async function api(url,opts={}){
    const r=await fetch(url,{...opts,headers:{'Content-Type':'application/json',...(opts.headers||{})}});
    const j=await r.json();
    if(!r.ok) throw Error(j.error||'Error de conexión');
    return j;
  }

  async function init(){
    $('authTitle').textContent='Ingresar al panel';
    $('authHint').textContent='Ingresá con las credenciales de demostración.';
    $('authName').parentElement.hidden=true;
    $('authForm').dataset.setup='false';
    try { me=await api('/api/me'); await load(); } catch {}
  }

  $('authForm').onsubmit=async e=>{
    e.preventDefault();
    const data=Object.fromEntries(new FormData(e.target));
    try{
      await api('/api/login',{method:'POST',body:JSON.stringify(data)});
      me=await api('/api/me');
      await load();
    }catch(err){ note(err.message); }
  };

  async function load(){
    props=await api('/api/admin/propiedades');
    $('auth').hidden=true;
    $('panel').hidden=false;
    $('logout').hidden=false;
    $('who').textContent=`${me.nombre} · ${me.rol}`;
    renderStats();
    renderTable();
    bindTabs();
    bindStaticActions();
  }

  function renderStats(){
    const statuses=['publicada','reservada','vendida','alquilada','borrador'];
    const cards=[['Inventario total',props.length,'🏘'],...statuses.map(s=>[s[0].toUpperCase()+s.slice(1),props.filter(p=>p.estado===s).length,'•'])];
    $('stats').innerHTML=cards.map(([a,b,i])=>`<article class="card metric"><span class="metric-icon">${i}</span><strong>${b}</strong><span>${a}</span></article>`).join('');
  }

  function renderTable(){
    const q=$('search').value.toLowerCase();
    const f=$('stateFilter').value;
    const filtered=props.filter(p=>(!f||p.estado===f)&&[p.titulo,p.zona,p.direccion,p.id,p.tipo].join(' ').toLowerCase().includes(q));
    $('rows').innerHTML=filtered.map(p=>`<tr>
      <td>
        <div class="propertyName">
          <img src="${esc(p.imagen||'')}" onerror="this.style.display='none'" alt="">
          <div>
            <strong>${esc(p.titulo)}</strong>
            <small>#${p.id} · ${esc(p.zona)} · ${esc(p.tipo)}</small>
          </div>
        </div>
      </td>
      <td>${esc(p.operacion)}</td>
      <td>${esc(fmt(p.precio,p.moneda))}</td>
      <td><span class="status ${esc(p.estado)}">${esc(p.estado)}</span></td>
      <td><div class="actions"><button data-view="${p.id}" class="view-btn">Ver ficha</button></div></td>
    </tr>`).join('') || '<tr><td colspan="5">No hay resultados.</td></tr>';
  }

  $('search').oninput=renderTable;
  $('stateFilter').onchange=renderTable;

  $('rows').onclick=e=>{
    const view=e.target.closest('[data-view]');
    if(view) openPreview(props.find(p=>p.id===Number(view.dataset.view)));
  };

  function openPreview(p){
    if(!p) return;
    $('editTitle').textContent=p.titulo;
    $('previewBody').innerHTML=`
      <div class="preview-grid">
        <div class="preview-media"><img src="${esc(p.imagen||'')}" alt="${esc(p.titulo)}"></div>
        <div class="preview-copy">
          <span class="preview-pill">${esc(p.operacion)} · ${esc(p.estado)}</span>
          <h3>${esc(p.titulo)}</h3>
          <p class="preview-price">${fmt(p.precio,p.moneda)}</p>
          <p class="preview-location">${esc(p.direccion)}, ${esc(p.zona)} · ${esc(p.ciudad||'Buenos Aires')}</p>
          <div class="preview-specs">
            <span>🛏 ${Number(p.dormitorios||0)} dorm.</span>
            <span>🛁 ${Number(p.baños||0)} baños</span>
            <span>📐 ${Number(p.metros||0)} m²</span>
            <span>${p.cochera?'🚗 Con cochera':'🚗 Sin cochera'}</span>
          </div>
          <p>${esc(p.descripcion||'Sin descripción.')}</p>
          <div class="side-note soft-demo-box">
            <strong>Versión demo</strong>
            <p>La edición de esta propiedad está deshabilitada. Para una versión real con alta, baja y modificación de inmuebles, contactá a Soyfacuh.com.</p>
          </div>
        </div>
      </div>`;
    $('editor').showModal();
  }

  $('add').onclick=demoAlert;
  $('demoAction').onclick=demoAlert;
  $('createUserDemo').onclick=demoAlert;
  $('save').onclick=()=>window.open('https://soyfacuh.com','_blank','noopener');
  $('close').onclick=$('cancel').onclick=()=>$('editor').close();
  $('logout').onclick=async()=>{ await api('/api/logout',{method:'POST'}); location.reload(); };
  $('teamForm').onsubmit=e=>{ e.preventDefault(); demoAlert(); };

  function bindTabs(){
    document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=async()=>{
      document.querySelectorAll('[data-tab]').forEach(x=>x.classList.toggle('selected',x===b));
      for(const id of ['properties','leads','team']) $(id).hidden=id!==b.dataset.tab;
      if(b.dataset.tab==='leads') renderLeads();
      if(b.dataset.tab==='team') renderTeam();
    });
  }

  async function renderLeads(){
    let list=[];
    try { list=await api('/api/admin/consultas'); } catch {}
    if(!Array.isArray(list) || !list.length) list=demoLeads;
    $('leadRows').innerHTML=list.map(l=>`<tr>
      <td>${new Date(l.fecha).toLocaleDateString('es-AR')}</td>
      <td>${esc(l.nombre)}<br><small>${esc(l.contacto)}</small></td>
      <td>${Number(l.presupuesto||0).toLocaleString('es-AR')}</td>
      <td>${esc(l.mensaje)}<br><small>Propiedad #${esc(l.propiedadId||'-')}</small></td>
    </tr>`).join('');
  }

  async function renderTeam(){
    let users=[];
    try { users=await api('/api/admin/usuarios'); } catch {}
    if(!Array.isArray(users) || !users.length) users=demoTeam;
    $('users').innerHTML=users.map(u=>`<article class="card user-card"><strong>${esc(u.nombre)}</strong><span>${esc(u.email)}</span><small>${esc(u.rol)}</small></article>`).join('');
  }

  function bindStaticActions(){
    note('Panel cargado en modo demo');
  }

  init().catch(e=>note(e.message));
})();
