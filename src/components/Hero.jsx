import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

// Fotos propias del negocio (guardadas en /public). Para agregar una más
// al carrusel, solo hay que sumar otra entrada acá con su imagen y, si
// querés, un texto distinto en el slide.
const SLIDES = [
  {
    image: "/hero.avif",
    eyebrow: "Insumos profesionales para nail artists",
    title: (
      <>
        Todo para tus uñas acrílicas,{" "}
        <span className="text-brand-400">en un solo lugar.</span>
      </>
    ),
    text: "Acrílicos, esmaltes semipermanentes, herramientas y kits con calidad de salón. Pedí desde el celu y recibilo en tu casa o estudio.",
  },
  {
    image: "/hero2.avif",
    eyebrow: "Calidad de salón, en tu casa",
    title: (
      <>
        Resultados de <span className="text-brand-400">nivel profesional.</span>
      </>
    ),
    text: "Los mismos productos que usan los nail artists, para que tus trabajos siempre queden impecables.",
  },
];

const AUTO_ADVANCE_MS = 6000;

export default function Hero() {
  const [index, setIndex] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (SLIDES.length <= 1) return undefined;
    timerRef.current = setInterval(() => {
      setIndex((i) => (i + 1) % SLIDES.length);
    }, AUTO_ADVANCE_MS);
    return () => clearInterval(timerRef.current);
  }, []);

  const goTo = (i) => {
    setIndex(i);
    // Si el usuario navega a mano, reiniciamos el conteo para que no
    // cambie de slide justo después de que lo tocó.
    clearInterval(timerRef.current);
    if (SLIDES.length > 1) {
      timerRef.current = setInterval(() => {
        setIndex((cur) => (cur + 1) % SLIDES.length);
      }, AUTO_ADVANCE_MS);
    }
  };

  const prev = () => goTo((index - 1 + SLIDES.length) % SLIDES.length);
  const next = () => goTo((index + 1) % SLIDES.length);

  return (
    <section className="relative overflow-hidden bg-navy">
      <div className="relative h-[480px] md:h-[560px]">
        {SLIDES.map((slide, i) => (
          <div
            key={slide.image}
            className={`absolute inset-0 bg-cover bg-center transition-opacity duration-700 ease-in-out ${
              i === index ? "opacity-100 z-10" : "opacity-0 z-0"
            }`}
            style={{ backgroundImage: `url('${slide.image}')` }}
            aria-hidden={i !== index}
          >
            {/* Degradé oscuro para que el texto blanco se siga leyendo sobre la foto */}
            <div
              className="absolute inset-0 bg-gradient-to-r from-navy/90 via-navy/60 to-navy/20"
              aria-hidden="true"
            />
          </div>
        ))}

        <div className="relative z-20 h-full max-w-7xl mx-auto px-4 flex items-center">
          <div className="max-w-md">
            <p className="text-brand-400 font-semibold text-sm tracking-wide uppercase mb-3">
              {SLIDES[index].eyebrow}
            </p>
            <h1 className="text-white font-display font-800 text-4xl md:text-5xl leading-tight">
              {SLIDES[index].title}
            </h1>
            <p className="text-slate-200 mt-5 text-base md:text-lg">
              {SLIDES[index].text}
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

        {SLIDES.length > 1 && (
          <>
            <button
              onClick={prev}
              aria-label="Foto anterior"
              className="hidden sm:grid absolute z-20 left-3 top-1/2 -translate-y-1/2 w-10 h-10 place-items-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <button
              onClick={next}
              aria-label="Foto siguiente"
              className="hidden sm:grid absolute z-20 right-3 top-1/2 -translate-y-1/2 w-10 h-10 place-items-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
              </svg>
            </button>

            <div className="absolute z-20 bottom-5 left-1/2 -translate-x-1/2 flex gap-2">
              {SLIDES.map((slide, i) => (
                <button
                  key={slide.image}
                  onClick={() => goTo(i)}
                  aria-label={`Ir a la foto ${i + 1}`}
                  aria-current={i === index}
                  className={`h-2 rounded-full transition-all ${
                    i === index ? "w-6 bg-white" : "w-2 bg-white/40 hover:bg-white/60"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
