/* =====================================================
   Verde Casa · Lógica principal (v2 mejorada)
   Nuevas features:
   - Favoritos con localStorage
   - Modal de detalle de propiedad
   - Modo oscuro persistente
   - Envío del form por WhatsApp
   - Fallback SVG para imágenes rotas
   - Skeletons durante el render
   - Toast notificaciones
   - JSON-LD dinámico por propiedad
   ===================================================== */

(function () {
  "use strict";

  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const clean = (v) => String(v ?? '').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const formatPrice = (p, m) => (m || "USD") + " " + Number(p).toLocaleString("es-AR");

  /* ---------- Fallback SVG placeholder ---------- */
  function placeholderDataUri(text) {
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'>
      <defs><linearGradient id='g' x1='0' x2='1' y1='0' y2='1'>
        <stop offset='0' stop-color='%23c9e4c5'/><stop offset='1' stop-color='%234a7c59'/>
      </linearGradient></defs>
      <rect width='400' height='300' fill='url(%23g)'/>
      <text x='50%' y='50%' text-anchor='middle' dy='.35em' font-family='Georgia,serif'
        font-size='22' fill='%23163a1e' opacity='.75'>${encodeURIComponent(text || 'Verde Casa')}</text>
    </svg>`;
    return "data:image/svg+xml;utf8," + svg.replace(/\n\s*/g, "");
  }
  function attachImgFallback(imgEl, label) {
    imgEl.addEventListener("error", function handle() {
      imgEl.removeEventListener("error", handle);
      imgEl.src = placeholderDataUri(label);
    });
  }

  /* ---------- Toast ---------- */
  const toastEl = $("#toast");
  let toastT;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastT);
    toastT = setTimeout(() => toastEl.classList.remove("show"), 2200);
  }

  /* ==================================================
     Favoritos (localStorage)
     ================================================== */
  const FAV_KEY = "verdana:favs";
  const favs = new Set(JSON.parse(localStorage.getItem(FAV_KEY) || "[]"));
  function saveFavs() {
    localStorage.setItem(FAV_KEY, JSON.stringify([...favs]));
    updateFavCount();
  }
  function updateFavCount() {
    const el = $("#favCount");
    el.textContent = favs.size;
    el.dataset.empty = favs.size === 0 ? "true" : "false";
  }
  function toggleFav(id) {
    if (favs.has(id)) { favs.delete(id); toast("Quitado de favoritos"); }
    else { favs.add(id); toast("Agregado a favoritos ♥"); }
    saveFavs();
  }
  updateFavCount();

  $("#btnFavs").addEventListener("click", () => {
    $("#fSoloFavs").checked = !$("#fSoloFavs").checked;
    render();
    document.getElementById("propiedades").scrollIntoView({ behavior: "smooth" });
  });

  /* ==================================================
     Tema (dark/light) persistente
     ================================================== */
  const THEME_KEY = "verdana:theme";
  const savedTheme = localStorage.getItem(THEME_KEY);
  if (savedTheme === "dark" || (!savedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
    document.documentElement.setAttribute("data-theme", "dark");
  }
  if ($("#btnTheme")) $("#btnTheme").addEventListener("click", () => {
    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    if (isDark) { document.documentElement.removeAttribute("data-theme"); localStorage.setItem(THEME_KEY, "light"); }
    else { document.documentElement.setAttribute("data-theme", "dark"); localStorage.setItem(THEME_KEY, "dark"); }
  });

  /* ==================================================
     Navbar
     ================================================== */
  const navbar    = $("#navbar");
  const hamburger = $("#hamburger");
  const navMenu   = $("#navMenu");

  window.addEventListener("scroll", () => {
    navbar.classList.toggle("scrolled", window.scrollY > 30);
    $("#toTop").classList.toggle("visible", window.scrollY > 600);
  }, { passive: true });

  hamburger.addEventListener("click", () => {
    const open = navMenu.classList.toggle("open");
    hamburger.classList.toggle("open", open);
    hamburger.setAttribute("aria-expanded", String(open));
    document.body.classList.toggle("menu-open", open);
  });

  $$("#navMenu a").forEach((a) => {
    a.addEventListener("click", () => {
      navMenu.classList.remove("open");
      hamburger.classList.remove("open");
      document.body.classList.remove("menu-open");
      const op = a.dataset.op;
      if (op) { $("#fOperacion").value = op; render(); }
    });
  });

  $("#toTop").addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      navMenu.classList.remove("open");
      hamburger.classList.remove("open");
      hamburger.setAttribute("aria-expanded", "false");
      document.body.classList.remove("menu-open");
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 768) {
      navMenu.classList.remove("open");
      hamburger.classList.remove("open");
      hamburger.setAttribute("aria-expanded", "false");
      document.body.classList.remove("menu-open");
    }
  });

  /* ==================================================
     Filtros dinámicos
     ================================================== */
  function populateSelect(id, items, placeholder) {
    const sel = $(id);
    sel.innerHTML = `<option value="">${placeholder}</option>` +
      items.map((v) => `<option value="${v}">${v}</option>`).join("");
  }
  populateSelect("#fTipo", TIPOS, "Todos");
  populateSelect("#fZona", ZONAS, "Todas");

  /* ==================================================
     Renderizado de tarjetas
     ================================================== */
  const grid  = $("#propiedadesGrid");
  const empty = $("#emptyState");
  const count = $("#resultsCount");

  function cardTemplate(p) {
    const badges = [];
    if (p.nueva)     badges.push('<span class="badge badge-new">Nuevo</span>');
    if (p.destacado) badges.push('<span class="badge badge-featured">Destacado</span>');
    const isFav = favs.has(p.id);

    return `
      <article class="property-card reveal" data-id="${p.id}">
        <button class="fav-btn ${isFav ? 'active' : ''}" data-fav="${p.id}" aria-label="${isFav ? 'Quitar de' : 'Agregar a'} favoritos" aria-pressed="${isFav}">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 21s-7-4.35-7-10a4.5 4.5 0 0 1 8-2.83A4.5 4.5 0 0 1 19 11c0 5.65-7 10-7 10Z"/>
          </svg>
        </button>
        <div class="property-media">
          <img src="${p.imagen}" alt="${p.titulo}" loading="lazy" data-fallback="${p.tipo} · ${p.zona}"/>
          <div class="property-badges">${badges.join("")}</div>
          <span class="property-op">${p.operacion}</span>
        </div>
        <div class="property-body">
          <div class="property-price">${formatPrice(p.precio, p.moneda)}${p.operacion === 'Alquiler' ? ' <small style="font-size:.75rem;color:var(--color-gray-500);font-weight:400;">/mes</small>' : ''}</div>
          <h3 class="property-title">${p.titulo}</h3>
          <p class="property-address">${p.tipo} · ${p.direccion}, ${p.zona}</p>
          <div class="property-features">
            ${p.dormitorios ? `<span title="Dormitorios">🛏 ${p.dormitorios} dorm.</span>` : ""}
            ${p.baños ? `<span title="Baños">🛁 ${p.baños} baños</span>` : ""}
            ${p.cochera ? `<span title="Cochera">🚗 Cochera</span>` : ""}
            <span title="Superficie">📐 ${p.metros} m²</span>
          </div>
          <button type="button" class="property-cta" data-prop-id="${p.id}">Ver detalle →</button>
        </div>
      </article>
    `;
  }

  function skeletonTemplate() {
    return `<div class="skeleton-card">
      <div class="skeleton-media"></div>
      <div class="skeleton-body">
        <div class="skeleton-line short"></div>
        <div class="skeleton-line mid"></div>
        <div class="skeleton-line"></div>
        <div class="skeleton-line short"></div>
      </div>
    </div>`;
  }

  function bindCardEvents() {
    $$(".property-cta").forEach((el) => {
      el.addEventListener("click", (e) => {
        e.preventDefault();
        openPropertyModal(+el.dataset.propId);
      });
    });
    $$("[data-fav]").forEach((el) => {
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = +el.dataset.fav;
        toggleFav(id);
        const on = favs.has(id);
        el.classList.toggle("active", on);
        el.setAttribute("aria-pressed", String(on));
        el.setAttribute("aria-label", (on ? "Quitar de" : "Agregar a") + " favoritos");
        if ($("#fSoloFavs").checked) render();
      });
    });
    $$("#propiedadesGrid img[data-fallback]").forEach((img) => attachImgFallback(img, img.dataset.fallback));
  }

  /* ==================================================
     Filtros + búsqueda + ordenamiento
     ================================================== */
  const state = () => ({
    op:    $("#fOperacion").value,
    tipo:  $("#fTipo").value,
    zona:  $("#fZona").value,
    texto: $("#fTexto").value.trim().toLowerCase(),
    min:   parseFloat($("#fMin").value) || 0,
    max:   parseFloat($("#fMax").value) || Infinity,
    orden: $("#fOrden").value,
    soloFavs: $("#fSoloFavs").checked
  });

  function applyFilters(list) {
    const s = state();
    let out = list.filter((p) => {
      if (s.soloFavs && !favs.has(p.id)) return false;
      if (s.op   && p.operacion !== s.op)   return false;
      if (s.tipo && p.tipo      !== s.tipo) return false;
      if (s.zona && p.zona      !== s.zona) return false;
      if (p.precio < s.min || p.precio > s.max) return false;
      if (s.texto) {
        const hay = (p.titulo + " " + p.ciudad + " " + p.zona + " " + p.direccion + " " + p.tipo).toLowerCase();
        if (!hay.includes(s.texto)) return false;
      }
      return true;
    });
    switch (s.orden) {
      case "menor":     out.sort((a, b) => a.precio - b.precio); break;
      case "mayor":     out.sort((a, b) => b.precio - a.precio); break;
      case "recientes": out.sort((a, b) => b.id - a.id); break;
      default:          out.sort((a, b) => (b.destacado - a.destacado) || (b.nueva - a.nueva));
    }
    return out;
  }

  function render() {
    const list = applyFilters(propiedades.filter(p => !p.estado || p.estado === "publicada")).map(p => ({...p,titulo:clean(p.titulo),direccion:clean(p.direccion),zona:clean(p.zona),tipo:clean(p.tipo),imagen:clean(p.imagen)}));
    empty.hidden = list.length !== 0;
    count.textContent = list.length
      ? `${list.length} propiedad${list.length === 1 ? "" : "es"} encontrada${list.length === 1 ? "" : "s"}`
      : "";
    grid.innerHTML = list.map(cardTemplate).join("");
    bindCardEvents();
    observeReveals();
  }

  ["fOperacion","fTipo","fZona","fTexto","fMin","fMax","fOrden","fSoloFavs"].forEach((id) => {
    const el = $("#" + id);
    el.addEventListener("input",  render);
    el.addEventListener("change", render);
  });
  $("#btnBuscar").addEventListener("click", render);

  $("#btnReset").addEventListener("click", () => {
    ["fOperacion","fTipo","fZona","fTexto","fMin","fMax"].forEach((id) => ($("#" + id).value = ""));
    $("#fOrden").value = "destacadas";
    $("#fSoloFavs").checked = false;
    render();
  });

  /* ==================================================
     Modal detalle de propiedad
     ================================================== */
  const modal = $("#propModal");
  const modalBody = $("#modalBody");
  let lastFocus = null;

  function openPropertyModal(id) {
    const raw = propiedades.find((x) => x.id === id);
    const p = raw && Object.fromEntries(Object.entries(raw).map(([k,v])=>[k, typeof v === "string" ? clean(v): v]));
    if (!p) return;
    lastFocus = document.activeElement;
    const isFav = favs.has(p.id);
    const waMsg = encodeURIComponent(`Hola ${AGENCIA.nombre}, me interesa la propiedad "${p.titulo}" (${formatPrice(p.precio, p.moneda)}). ¿Me pueden dar más info?`);
    modalBody.innerHTML = `
      <div class="modal-hero">
        <img src="${p.imagen}" alt="${p.titulo}" data-fallback="${p.tipo} · ${p.zona}"/>
      </div>
      <div class="modal-body-content">
        <div class="modal-price">${formatPrice(p.precio, p.moneda)}${p.operacion === 'Alquiler' ? ' <small style="font-size:.9rem;color:var(--color-gray-500);font-weight:400;">/mes</small>' : ''}</div>
        <h2 id="modalTitle" class="modal-title">${p.titulo}</h2>
        <p class="modal-address">${p.operacion} · ${p.tipo} · ${p.direccion}, ${p.zona}, ${p.ciudad}</p>
        <div class="modal-specs">
          ${p.dormitorios ? `<div class="spec"><div class="spec-label">Dorm.</div><div class="spec-value">${p.dormitorios}</div></div>` : ''}
          ${p.baños ? `<div class="spec"><div class="spec-label">Baños</div><div class="spec-value">${p.baños}</div></div>` : ''}
          <div class="spec"><div class="spec-label">Superficie</div><div class="spec-value">${p.metros} m²</div></div>
          <div class="spec"><div class="spec-label">Cochera</div><div class="spec-value">${p.cochera ? 'Sí' : 'No'}</div></div>
        </div>
        <p class="modal-desc">${p.descripcion}</p>
        <div class="modal-actions">
          <a class="btn btn-primary" href="https://wa.me/${AGENCIA.whatsapp}?text=${waMsg}" target="_blank" rel="noopener">Consultar por WhatsApp</a>
          <a class="btn btn-outline" href="mailto:${AGENCIA.email}?subject=${encodeURIComponent('Consulta: ' + p.titulo)}&body=${waMsg}">Enviar email</a>
          <button type="button" class="btn btn-outline" data-fav-modal="${p.id}">${isFav ? '♥ Quitar de favoritos' : '♡ Guardar en favoritos'}</button>
          <button type="button" class="btn btn-outline" id="btnShare">Compartir</button>
        </div>
      </div>
    `;
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    attachImgFallback(modalBody.querySelector("img"), `${p.tipo} · ${p.zona}`);
    $("#modalBody [data-fav-modal]").addEventListener("click", (e) => {
      const pid = +e.currentTarget.dataset.favModal;
      toggleFav(pid);
      e.currentTarget.textContent = favs.has(pid) ? "♥ Quitar de favoritos" : "♡ Guardar en favoritos";
      render();
    });
    $("#btnShare").addEventListener("click", async () => {
      const shareUrl = `${location.origin}${location.pathname}#propiedad-${p.id}`;
      const data = { title: `${p.titulo} · ${AGENCIA.nombre}`, text: `${p.titulo} · ${formatPrice(p.precio, p.moneda)}`, url: shareUrl };
      if (navigator.share) { try { await navigator.share(data); } catch (_) {} }
      else { try { await navigator.clipboard.writeText(shareUrl); toast("Link copiado"); } catch (_) { toast("No se pudo copiar"); } }
    });
    setTimeout(() => $(".modal-close").focus(), 50);
  }

  function closeModal() {
    modal.hidden = true;
    document.body.style.overflow = "";
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  modal.addEventListener("click", (e) => { if (e.target.dataset.close !== undefined) closeModal(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !modal.hidden) closeModal(); });

  /* ==================================================
     Animaciones scroll (IntersectionObserver)
     ================================================== */
  let io;
  function observeReveals() {
    if (!("IntersectionObserver" in window)) { $$(".reveal").forEach((el) => el.classList.add("visible")); return; }
    if (io) io.disconnect();
    io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("visible"); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    $$(".reveal:not(.visible)").forEach((el) => io.observe(el));
  }

  /* ==================================================
     Contadores animados
     ================================================== */
  const counters = $$(".stat-num");
  const counterObs = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const target = +el.dataset.target;
      const dur = 1600;
      const start = performance.now();
      (function tick(now) {
        const p = Math.min((now - start) / dur, 1);
        el.textContent = Math.floor(p * target).toLocaleString("es-AR");
        if (p < 1) requestAnimationFrame(tick);
      })(start);
      counterObs.unobserve(el);
    });
  }, { threshold: 0.4 });
  counters.forEach((c) => counterObs.observe(c));

  /* ==================================================
     Formulario contacto (validación + WhatsApp)
     ================================================== */
  const form = $("#contactForm");
  function validate() {
    let ok = true;
    const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    $$(".field", form).forEach((f) => {
      const input = f.querySelector("input, textarea");
      const err   = f.querySelector(".error");
      f.classList.remove("invalid"); err.textContent = "";
      if (input.required && !input.value.trim()) { err.textContent = "Este campo es obligatorio."; f.classList.add("invalid"); ok = false; return; }
      if (input.type === "email" && input.value && !emailRx.test(input.value)) { err.textContent = "Ingresá un email válido."; f.classList.add("invalid"); ok = false; }
    });
    return ok;
  }
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!validate()) return;
    $("#formSuccess").hidden = false;
    form.reset();
    setTimeout(() => ($("#formSuccess").hidden = true), 5000);
  });
  $("#btnWhatsapp").addEventListener("click", () => {
    if (!validate()) return;
    const fd = new FormData(form);
    const msg = `*Nueva consulta desde la web*%0A%0A*Nombre:* ${fd.get("nombre")}%0A*Email:* ${fd.get("email")}%0A*Teléfono:* ${fd.get("telefono") || "-"}%0A%0A*Mensaje:*%0A${fd.get("mensaje")}`;
    window.open(`https://wa.me/${AGENCIA.whatsapp}?text=${msg}`, "_blank");
  });

  /* ==================================================
     JSON-LD dinámico por propiedad (SEO)
     ================================================== */
  (function injectLd() {
    const items = propiedades.map((p) => ({
      "@context": "https://schema.org",
      "@type": "Product",
      "name": p.titulo,
      "description": p.descripcion,
      "image": p.imagen,
      "category": p.tipo,
      "offers": {
        "@type": "Offer",
        "price": p.precio,
        "priceCurrency": p.moneda,
        "availability": "https://schema.org/InStock",
        "url": location.origin + location.pathname + "#propiedad-" + p.id
      }
    }));
    const s = document.createElement("script");
    s.type = "application/ld+json";
    s.textContent = JSON.stringify(items);
    document.head.appendChild(s);
  })();

  /* Footer year */
  $("#year").textContent = new Date().getFullYear();

  /* Skeleton inicial + render */
  grid.innerHTML = Array.from({ length: 6 }).map(skeletonTemplate).join("");
  requestAnimationFrame(() => { render(); observeReveals(); });

  /* Fallback logo/hero */
  const logoImg = document.querySelector(".brand-logo");
  if (logoImg) attachImgFallback(logoImg, "");
  const heroBg = document.querySelector(".hero-bg");
  if (heroBg) {
    const test = new Image();
    test.onerror = () => {
      heroBg.style.background = "linear-gradient(135deg, #163a1e 0%, #234f2c 60%, #4a7c59 100%)";
    };
    test.src = "img/hero.jpg";
  }

  /* Deep-link: abrir modal si la URL tiene #propiedad-N */
  if (location.hash.startsWith("#propiedad-")) {
    const id = +location.hash.replace("#propiedad-", "");
    setTimeout(() => openPropertyModal(id), 400);
  }
})();
