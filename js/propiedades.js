/* =====================================================
   Datos de propiedades y catálogos
   Editá este archivo para agregar/quitar propiedades.
   ===================================================== */

/* Datos de la agencia (usados por WhatsApp / contactos) */
const AGENCIA = {
  nombre: "Verde Casa",
  whatsapp: "5491111111111", // sin + ni espacios
  email: "contacto@verdecasa.test"
};

const TIPOS = ["Casa", "Departamento", "Oficina", "Local", "Terreno", "Country", "Quinta"];
const ZONAS = ["Palermo", "Belgrano", "Recoleta", "Caballito", "Tigre", "Nordelta", "Puerto Madero"];

const propiedadesEjemplo = [
  {
    id: 1, titulo: "Penthouse con vista panorámica", operacion: "Venta", tipo: "Departamento",
    zona: "Palermo", ciudad: "Buenos Aires", direccion: "Av. del Libertador 3450",
    precio: 890000, moneda: "USD", dormitorios: 3, baños: 3, cochera: true, metros: 210,
    destacado: true, nueva: true, imagen: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1100&q=82",
    descripcion: "Espectacular penthouse en piso alto con vistas 360° al río y a la ciudad. Terminaciones premium, cocina integrada Bulthaup, amplios ventanales piso-techo y terraza con parrilla y jacuzzi. Amenities completos."
  },
  {
    id: 2, titulo: "Casa contemporánea con pileta", operacion: "Venta", tipo: "Casa",
    zona: "Nordelta", ciudad: "Tigre", direccion: "Barrio El Golf 245",
    precio: 1250000, moneda: "USD", dormitorios: 4, baños: 4, cochera: true, metros: 380,
    destacado: true, nueva: false, imagen: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1100&q=82",
    descripcion: "Casa moderna de estilo minimalista con jardín paisajístico, pileta climatizada, quincho equipado, home cinema y suite principal con vestidor."
  },
  {
    id: 3, titulo: "Departamento luminoso en Palermo", operacion: "Alquiler", tipo: "Departamento",
    zona: "Palermo", ciudad: "Buenos Aires", direccion: "Guatemala 5120",
    precio: 1200, moneda: "USD", dormitorios: 2, baños: 1, cochera: false, metros: 78,
    destacado: false, nueva: true, imagen: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1100&q=82",
    descripcion: "Ambiente amplio, luminoso y con excelente distribución. Balcón corrido, cocina abierta y edificio con seguridad 24hs."
  },
  {
    id: 4, titulo: "Oficina premium en Recoleta", operacion: "Alquiler", tipo: "Oficina",
    zona: "Recoleta", ciudad: "Buenos Aires", direccion: "Av. Alvear 1890",
    precio: 3500, moneda: "USD", dormitorios: 0, baños: 2, cochera: true, metros: 220,
    destacado: false, nueva: false, imagen: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1100&q=82",
    descripcion: "Oficina en edificio corporativo AAA con vista abierta, salas de reuniones, recepción, aire central y estacionamiento privado."
  },
  {
    id: 5, titulo: "Casaquinta con parque privado", operacion: "Venta", tipo: "Quinta",
    zona: "Tigre", ciudad: "Tigre", direccion: "Camino Real 890",
    precio: 680000, moneda: "USD", dormitorios: 5, baños: 4, cochera: true, metros: 620,
    destacado: true, nueva: false, imagen: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1100&q=82",
    descripcion: "Amplio parque arbolado, pileta y galería con parrilla. Ideal para familias que buscan tranquilidad a 40 min de la ciudad."
  },
  {
    id: 6, titulo: "Local comercial premium", operacion: "Alquiler", tipo: "Local",
    zona: "Recoleta", ciudad: "Buenos Aires", direccion: "Av. Santa Fe 1420",
    precio: 4200, moneda: "USD", dormitorios: 0, baños: 1, cochera: false, metros: 140,
    destacado: false, nueva: true, imagen: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1100&q=82",
    descripcion: "Ubicación inmejorable con gran vidriera sobre avenida principal. Alto tránsito peatonal, sótano y depósito."
  },
  {
    id: 7, titulo: "Loft de diseño en Puerto Madero", operacion: "Venta", tipo: "Departamento",
    zona: "Puerto Madero", ciudad: "Buenos Aires", direccion: "Juana Manso 1440",
    precio: 520000, moneda: "USD", dormitorios: 1, baños: 2, cochera: true, metros: 95,
    destacado: true, nueva: true, imagen: "https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=1100&q=82",
    descripcion: "Loft de doble altura con vista al dique, cocina integrada y amenities de primer nivel: piscina, gym, spa y seguridad 24hs."
  },
  {
    id: 8, titulo: "Terreno con proyecto aprobado", operacion: "Venta", tipo: "Terreno",
    zona: "Caballito", ciudad: "Buenos Aires", direccion: "Rojas 550",
    precio: 320000, moneda: "USD", dormitorios: 0, baños: 0, cochera: false, metros: 420,
    destacado: false, nueva: true, imagen: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1100&q=82",
    descripcion: "Terreno ideal para desarrollo residencial. Cuenta con proyecto de edificio de 6 pisos aprobado y planos ejecutivos."
  }
];

let propiedades = propiedadesEjemplo;
