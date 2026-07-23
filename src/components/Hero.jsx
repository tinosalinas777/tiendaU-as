import { Link } from "react-router-dom";

// Foto de stock (Unsplash, licencia libre para uso comercial) mientras no
// tengas tus propias fotos de producto/local — podés reemplazar esta URL
// por una imagen propia en /public y usar "/mi-foto.jpg" en su lugar.
const HERO_IMAGE =
  "https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&w=1920&q=80";

export default function Hero() {
  return (
    <section
      className="relative overflow-hidden bg-navy bg-cover bg-center"
      style={{ backgroundImage: `url('${HERO_IMAGE}')` }}
    >
      {/* Degradé oscuro para que el texto blanco se siga leyendo sobre la foto */}
      <div
        className="absolute inset-0 bg-gradient-to-r from-navy/90 via-navy/60 to-navy/20"
        aria-hidden="true"
      />
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-16 md:py-24 grid md:grid-cols-2 gap-10 items-center">
        <div>
          <p className="text-brand-400 font-semibold text-sm tracking-wide uppercase mb-3">
            Insumos profesionales para nail artists
          </p>
          <h1 className="text-white font-display font-800 text-4xl md:text-5xl leading-tight">
            Todo para tus uñas acrílicas,{" "}
            <span className="text-brand-400">en un solo lugar.</span>
          </h1>
          <p className="text-slate-200 mt-5 text-base md:text-lg max-w-md">
            Acrílicos, esmaltes semipermanentes, herramientas y kits con
            calidad de salón. Pedí desde el celu y recibilo en tu casa o
            estudio.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/tienda"
              className="bg-brand-500 hover:bg-brand-600 transition-colors text-white font-semibold px-6 py-3 rounded-lg"
            >
              Ver productos
            </Link>
            <Link
              to="/tienda?ofertas=1"
              className="border border-white/30 hover:border-white/60 transition-colors text-white font-semibold px-6 py-3 rounded-lg"
            >
              Ver ofertas
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
