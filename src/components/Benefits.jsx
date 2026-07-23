// Fotos propias del negocio (guardadas en /public).
const benefits = [
  {
    image: "/originales.avif",
    title: "Productos originales",
    text: "Marcas profesionales, siempre en stock",
  },
  {
    image: "/salon.avif",
    title: "Calidad de salón",
    text: "Los mismos insumos que usan los profesionales",
  },
  {
    image: "/pagos.avif",
    title: "Varios medios de pago",
    text: "Tarjeta, transferencia o efectivo",
  },
  {
    image: "/atencion.avif",
    title: "Atención personalizada",
    text: "Te asesoramos por WhatsApp",
  },
];

export default function Benefits() {
  return (
    <section className="border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-2 md:grid-cols-4 gap-6">
        {benefits.map((b) => (
          <div key={b.title}>
            <img
              src={b.image}
              alt={b.title}
              loading="lazy"
              className="w-full aspect-[4/3] object-cover rounded-xl shadow-card"
            />
            <div className="flex items-center gap-3 mt-3">
              <div>
                <p className="font-semibold text-navy text-sm">{b.title}</p>
                <p className="text-slate-500 text-xs">{b.text}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
