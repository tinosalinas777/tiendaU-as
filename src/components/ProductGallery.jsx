// Junta las fotos del producto en un solo array de URLs. Soporta:
// - `product.images`: array con varias fotos (lo nuevo, se carga desde el admin)
// - `product.image_url`: una sola foto (productos viejos, sigue funcionando)
// Si no hay ninguna foto cargada, se muestra el emoji/ícono como antes.
export function getProductImages(product) {
  if (Array.isArray(product.images) && product.images.length > 0) {
    return product.images.filter(Boolean)
  }
  if (product.image_url) return [product.image_url]
  return []
}

function Thumbnails({ images, activeImage, onSelect, className }) {
  return (
    <div className={className}>
      {images.map((src, i) => (
        <button
          key={src + i}
          type="button"
          onClick={() => onSelect(i)}
          aria-label={`Ver foto ${i + 1}`}
          aria-current={i === activeImage}
          className={`aspect-square w-16 shrink-0 rounded-lg overflow-hidden border-2 transition-colors ${
            i === activeImage ? 'border-brand-500' : 'border-transparent hover:border-slate-200'
          }`}
        >
          <img src={src} alt="" className="w-full h-full object-cover" />
        </button>
      ))}
    </div>
  )
}

export default function ProductGallery({ product, activeImage, onSelect }) {
  const images = getProductImages(product)
  const current = images[activeImage] || images[0]
  const hasMultiple = images.length > 1

  return (
    <div>
      <div className="flex gap-3">
        {/* Miniaturas verticales, a la izquierda — solo en pantallas medianas o más grandes */}
        {hasMultiple && (
          <Thumbnails
            images={images}
            activeImage={activeImage}
            onSelect={onSelect}
            className="hidden sm:flex flex-col gap-2"
          />
        )}

        <div className="flex-1 aspect-square bg-slate-50 rounded-2xl grid place-items-center text-8xl overflow-hidden">
          {current ? (
            <img src={current} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            product.icon || '💅'
          )}
        </div>
      </div>

      {/* En mobile, las miniaturas van en una fila debajo de la foto principal */}
      {hasMultiple && (
        <Thumbnails
          images={images}
          activeImage={activeImage}
          onSelect={onSelect}
          className="sm:hidden flex gap-2 mt-3 overflow-x-auto"
        />
      )}
    </div>
  )
}
