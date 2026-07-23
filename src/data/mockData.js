// Catálogo de ejemplo. Se usa como respaldo mientras conectás Supabase,
// o si las tablas todavía están vacías. La estructura coincide 1 a 1
// con las tablas `categories` y `products` del esquema SQL (ver supabase/schema.sql).

export const mockCategories = [
  { id: 'acrilico', name: 'Acrílicos', icon: '💅' },
  { id: 'semipermanente', name: 'Esmaltes Semipermanentes', icon: '💄' },
  { id: 'nailart', name: 'Nail Art y Decoración', icon: '✨' },
  { id: 'herramientas', name: 'Herramientas y Limas', icon: '🛠️' },
  { id: 'lamparas', name: 'Lámparas UV/LED', icon: '💡' },
  { id: 'cuidado', name: 'Cuidado de Cutículas', icon: '🧴' },
  { id: 'tips', name: 'Tips y Moldes', icon: '🗂️' },
  { id: 'kits', name: 'Kits Completos', icon: '🎁' },
]

export const mockProducts = [
  { id: 1, name: 'Polvo acrílico rosa nude 30g', category_id: 'acrilico', price: 8990, unit: 'un', stock: 22, rating: 4.8, reviews: 64, icon: '💅', badge: 'Más vendido' },
  { id: 2, name: 'Polvo acrílico blanco francés 30g', category_id: 'acrilico', price: 8990, unit: 'un', stock: 18, rating: 4.7, reviews: 41, icon: '💅' },
  { id: 3, name: 'Monómero líquido premium 250ml', category_id: 'acrilico', price: 12490, unit: 'un', stock: 15, rating: 4.6, reviews: 37, icon: '🧪' },
  { id: 4, name: 'Primer ácido para acrílico 15ml', category_id: 'acrilico', price: 4290, unit: 'un', stock: 30, rating: 4.5, reviews: 28, icon: '🧴' },
  { id: 5, name: 'Esmalte semipermanente nude x15ml', category_id: 'semipermanente', price: 5490, unit: 'un', stock: 45, rating: 4.8, reviews: 132, icon: '💄', badge: 'Oferta' },
  { id: 6, name: 'Esmalte semipermanente rojo pasión x15ml', category_id: 'semipermanente', price: 5490, unit: 'un', stock: 38, rating: 4.7, reviews: 97, icon: '💄' },
  { id: 7, name: 'Top coat sellador brillante 15ml', category_id: 'semipermanente', price: 4990, unit: 'un', stock: 40, rating: 4.9, reviews: 156, icon: '✨' },
  { id: 8, name: 'Base coat fortalecedora 15ml', category_id: 'semipermanente', price: 4990, unit: 'un', stock: 36, rating: 4.7, reviews: 88, icon: '🧴' },
  { id: 9, name: 'Set glitter holográfico x12 colores', category_id: 'nailart', price: 6990, unit: 'un', stock: 25, rating: 4.6, reviews: 52, icon: '✨', badge: '2x1' },
  { id: 10, name: 'Stickers 3D flores para nail art', category_id: 'nailart', price: 2890, unit: 'un', stock: 60, rating: 4.5, reviews: 44, icon: '🌸' },
  { id: 11, name: 'Pinceles para nail art x6', category_id: 'nailart', price: 5990, unit: 'un', stock: 20, rating: 4.7, reviews: 39, icon: '🖌️' },
  { id: 12, name: 'Strass y piedras de cristal surtidas', category_id: 'nailart', price: 3490, unit: 'un', stock: 50, rating: 4.6, reviews: 61, icon: '💎' },
  { id: 13, name: 'Pincel kolinsky N°8 para esculpido', category_id: 'herramientas', price: 9990, unit: 'un', stock: 14, rating: 4.9, reviews: 73, icon: '🖌️', badge: 'Premium' },
  { id: 14, name: 'Set de limas profesionales x10', category_id: 'herramientas', price: 4490, unit: 'un', stock: 42, rating: 4.6, reviews: 68, icon: '🛠️' },
  { id: 15, name: 'Fresa eléctrica para uñas', category_id: 'herramientas', price: 34990, unit: 'un', stock: 8, rating: 4.8, reviews: 45, icon: '⚙️', badge: 'Top' },
  { id: 16, name: 'Alicate cutícula acero inoxidable', category_id: 'herramientas', price: 6490, unit: 'un', stock: 27, rating: 4.7, reviews: 51, icon: '✂️' },
  { id: 17, name: 'Lámpara UV/LED 48W profesional', category_id: 'lamparas', price: 28990, unit: 'un', stock: 12, rating: 4.8, reviews: 84, icon: '💡', badge: 'Top' },
  { id: 18, name: 'Lámpara LED portátil recargable', category_id: 'lamparas', price: 17990, unit: 'un', stock: 16, rating: 4.5, reviews: 33, icon: '🔋' },
  { id: 19, name: 'Aceite de cutículas con vitamina E', category_id: 'cuidado', price: 3290, unit: 'un', stock: 55, rating: 4.7, reviews: 76, icon: '🧴' },
  { id: 20, name: 'Removedor de cutículas gel 30ml', category_id: 'cuidado', price: 2990, unit: 'un', stock: 48, rating: 4.5, reviews: 40, icon: '🧴' },
  { id: 21, name: 'Tips transparentes almendra x500', category_id: 'tips', price: 5990, unit: 'un', stock: 33, rating: 4.6, reviews: 58, icon: '🗂️' },
  { id: 22, name: 'Moldes de nail form para esculpido x100', category_id: 'tips', price: 3990, unit: 'un', stock: 29, rating: 4.5, reviews: 31, icon: '📐' },
  { id: 23, name: 'Kit iniciación acrílico completo', category_id: 'kits', price: 42990, unit: 'un', stock: 10, rating: 4.9, reviews: 112, icon: '🎁', badge: 'Más vendido' },
  { id: 24, name: 'Kit nail art 40 piezas', category_id: 'kits', price: 15990, unit: 'un', stock: 17, rating: 4.6, reviews: 47, icon: '🎁' },
]
