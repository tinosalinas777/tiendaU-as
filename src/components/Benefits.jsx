// Fotos de stock (Unsplash, licencia libre para uso comercial). Podés
// reemplazarlas por fotos propias de tu local/productos poniéndolas en
// /public y usando la ruta local, por ejemplo "/mi-foto.jpg".
const benefits = [
  {
    image:
      "https://images.unsplash.com/photo-1619607146034-5a05296c8f9a?auto=format&fit=crop&w=800&h=600&q=80",
    title: "Productos originales",
    text: "Marcas profesionales, siempre en stock",
  },
  {
    image:
      "https://images.unsplash.com/photo-1607779097040-26e80aa78e66?auto=format&fit=crop&w=800&h=600&q=80",
    title: "Calidad de salón",
    text: "Los mismos insumos que usan los profesionales",
  },
  {
    image:
      "https://images.unsplash.com/photo-1630843599725-32ead7671867?auto=format&fit=crop&w=800&h=600&q=80",
    title: "Varios medios de pago",
    text: "Tarjeta, transferencia o efectivo",
  },
  {
    image:
      "https://images.unsplash.com/photo-1690749138086-7422f71dc159?auto=format&fit=crop&w=800&h=600&q=80",
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
