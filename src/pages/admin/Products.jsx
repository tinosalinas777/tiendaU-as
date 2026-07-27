import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'

const EMPTY_FORM = {
  name: '', category_id: '', price: '', unit: 'un', stock: '', min_stock: '5',
  supplier_id: '', icon: '💅', badge: '', active: true,
}
// Límite generoso: la foto se comprime y redimensiona ANTES de subirla
// (ver compressImage), así que una foto de 6-8MB del celu tranquilamente
// termina pesando unos cientos de KB una vez optimizada.
const MAX_RAW_IMAGE_MB = 8
const MAX_IMAGES_PER_PRODUCT = 6
const MAX_WIDTH = 1400
const MAX_HEIGHT = 1400
const WEBP_QUALITY = 0.82

// Algunos formatos (como .jfif) no siempre se identifican bien por
// file.type en el navegador — por eso validamos también por extensión.
const KNOWN_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'jfif', 'png', 'webp', 'gif', 'avif', 'heic', 'heif']

// Redimensiona y convierte la imagen a WebP del lado del navegador antes
// de subirla a Supabase Storage. Si algo falla o el navegador no soporta
// WebP, devuelve el archivo original tal cual (nunca bloquea la subida).
async function compressImage(file) {
  // No tocamos GIFs (podrían ser animados) ni SVGs (son vectoriales).
  if (file.type === 'image/gif' || file.name.toLowerCase().endsWith('.svg')) {
    return file
  }

  try {
    const source = await loadImageSource(file)
    if (!source) return file

    let { width, height } = getSourceSize(source)
    if (width > MAX_WIDTH || height > MAX_HEIGHT) {
      const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height)
      width = Math.round(width * ratio)
      height = Math.round(height * ratio)
    }

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    ctx.drawImage(source, 0, 0, width, height)

    const supportsWebp = canvas.toDataURL('image/webp').startsWith('data:image/webp')
    const outputType = supportsWebp ? 'image/webp' : 'image/jpeg'
    const outputExt = supportsWebp ? 'webp' : 'jpg'

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, outputType, WEBP_QUALITY))
    if (!blob) return file

    const baseName = file.name.replace(/\.[^.]+$/, '')
    return new File([blob], `${baseName}.${outputExt}`, { type: outputType })
  } catch (err) {
    console.warn('No se pudo optimizar la imagen, se sube el archivo original:', err)
    return file
  }
}

function loadImageSource(file) {
  if (window.createImageBitmap) {
    return createImageBitmap(file).catch(() => loadImageViaElement(file))
  }
  return loadImageViaElement(file)
}

function loadImageViaElement(file) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = URL.createObjectURL(file)
  })
}

function getSourceSize(source) {
  return { width: source.width, height: source.height }
}

let nextImageKey = 1
const makeImageKey = () => `img-${nextImageKey++}`

export default function AdminProducts() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Cada foto del producto que se está editando/creando: { key, url, file, preview }
  // - `url`: ya subida a Supabase Storage (foto existente)
  // - `file`: recién elegida, todavía no subida (se sube al guardar)
  // La primera foto de la lista es la que se usa como portada en la tienda.
  const [images, setImages] = useState([])
  const [compressingImage, setCompressingImage] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)

  const load = async () => {
    setLoading(true)
    const [{ data: prods }, { data: cats }, { data: provs }] = await Promise.all([
      supabase.from('products').select('*').order('name'),
      supabase.from('categories').select('*').order('name'),
      supabase.from('suppliers').select('*').eq('active', true).order('name'),
    ])
    setProducts(prods || [])
    setCategories(cats || [])
    setSuppliers(provs || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleImagesChange = async (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    setError('')

    const room = MAX_IMAGES_PER_PRODUCT - images.length
    if (room <= 0) {
      setError(`Ya tenés el máximo de ${MAX_IMAGES_PER_PRODUCT} fotos para este producto.`)
      e.target.value = ''
      return
    }
    const toProcess = files.slice(0, room)

    for (const file of toProcess) {
      const ext = file.name.split('.').pop()?.toLowerCase()
      const looksLikeImage = file.type.startsWith('image/') || KNOWN_IMAGE_EXTENSIONS.includes(ext)
      if (!looksLikeImage) {
        setError('Alguno de los archivos no es una imagen válida (jpg, jfif, png, webp, etc) y se salteó.')
        continue
      }
      if (file.size > MAX_RAW_IMAGE_MB * 1024 * 1024) {
        setError(`Alguna imagen pesa más de ${MAX_RAW_IMAGE_MB}MB y se salteó.`)
        continue
      }

      setCompressingImage(true)
      const optimized = await compressImage(file)
      setCompressingImage(false)

      setImages((prev) => [
        ...prev,
        { key: makeImageKey(), url: null, file: optimized, preview: URL.createObjectURL(optimized) },
      ])
    }

    e.target.value = ''
  }

  const removeImage = (key) => {
    setImages((prev) => prev.filter((img) => img.key !== key))
  }

  const makeCover = (key) => {
    setImages((prev) => {
      const found = prev.find((img) => img.key === key)
      if (!found) return prev
      return [found, ...prev.filter((img) => img.key !== key)]
    })
  }

  const startEdit = (p) => {
    setEditingId(p.id)
    setForm({
      name: p.name,
      category_id: p.category_id || '',
      price: p.price,
      unit: p.unit,
      stock: p.stock,
      min_stock: p.min_stock ?? 5,
      supplier_id: p.supplier_id || '',
      icon: p.icon || '💅',
      badge: p.badge || '',
      active: p.active,
    })
    const existingUrls = Array.isArray(p.images) && p.images.length > 0
      ? p.images
      : p.image_url ? [p.image_url] : []
    setImages(existingUrls.filter(Boolean).map((url) => ({ key: makeImageKey(), url, file: null, preview: url })))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setImages([])
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    // Subimos únicamente las fotos nuevas (las que ya tenían `url` quedan
    // como estaban). El orden final de `images` define cuál es la portada
    // (la primera) — ese mismo orden es el que ve el cliente en la galería.
    const finalImageUrls = []
    const pending = images.filter((img) => img.file)

    if (pending.length > 0) setUploadingImage(true)

    for (const img of images) {
      if (img.url) {
        finalImageUrls.push(img.url)
        continue
      }
      const ext = img.file.name.split('.').pop().toLowerCase()
      const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(path, img.file, { cacheControl: '3600', upsert: false, contentType: img.file.type })

      if (uploadError) {
        setUploadingImage(false)
        setSaving(false)
        setError(
          'No se pudo subir una de las fotos. ' +
            uploadError.message +
            ' (revisá que hayas creado el bucket "product-images" — ver README).',
        )
        return
      }

      const { data: publicUrlData } = supabase.storage.from('product-images').getPublicUrl(path)
      finalImageUrls.push(publicUrlData.publicUrl)
    }
    setUploadingImage(false)

    const payload = {
      name: form.name,
      category_id: form.category_id || null,
      price: Number(form.price),
      unit: form.unit,
      stock: Number(form.stock),
      min_stock: Number(form.min_stock) || 0,
      supplier_id: form.supplier_id || null,
      icon: form.icon,
      badge: form.badge || null,
      active: form.active,
      images: finalImageUrls,
      // Se mantiene en sync con la primera foto de la galería (portada),
      // así el listado de productos y las product cards de la tienda —que
      // todavía usan este campo— siguen mostrando la foto correcta.
      image_url: finalImageUrls[0] || null,
    }

    const { error } = editingId
      ? await supabase.from('products').update(payload).eq('id', editingId)
      : await supabase.from('products').insert(payload)

    setSaving(false)
    if (error) {
      setError('No se pudo guardar el producto. ' + error.message)
      return
    }
    cancelEdit()
    load()
  }

  const toggleActive = async (p) => {
    await supabase.from('products').update({ active: !p.active }).eq('id', p.id)
    load()
  }

  const deleteProduct = async (p) => {
    if (!confirm(`¿Eliminar "${p.name}" definitivamente? Esta acción no se puede deshacer.`)) return
    await supabase.from('products').delete().eq('id', p.id)
    load()
  }

  const busy = saving || uploadingImage || compressingImage

  return (
    <div className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="font-display font-800 text-2xl text-navy">Productos</h1>
        <Link
          to="/admin/stock"
          className="text-brand-500 text-sm font-medium hover:underline"
        >
          Ver movimientos de stock →
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-slate-100 rounded-xl shadow-card p-5 mb-8">
        <h2 className="font-display font-700 text-navy mb-4">
          {editingId ? `Editando producto #${editingId}` : 'Agregar producto nuevo'}
        </h2>

        <div className="mb-5">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Fotos del producto ({images.length}/{MAX_IMAGES_PER_PRODUCT})
          </label>
          <div className="flex flex-wrap gap-3">
            {images.map((img, i) => (
              <div key={img.key} className="relative w-24 h-24 rounded-lg overflow-hidden border border-slate-200 group">
                <img src={img.preview} alt="" className="w-full h-full object-cover" />
                {i === 0 && (
                  <span className="absolute top-1 left-1 bg-brand-500 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded">
                    Portada
                  </span>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                  {i !== 0 && (
                    <button
                      type="button"
                      onClick={() => makeCover(img.key)}
                      title="Usar como portada"
                      className="w-7 h-7 rounded-full bg-white/90 grid place-items-center text-sm"
                    >
                      ⭐
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => removeImage(img.key)}
                    title="Quitar foto"
                    className="w-7 h-7 rounded-full bg-white/90 grid place-items-center text-sm"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}

            {images.length < MAX_IMAGES_PER_PRODUCT && (
              <label className="w-24 h-24 rounded-lg border-2 border-dashed border-slate-200 grid place-items-center cursor-pointer text-center text-xs text-slate-400 hover:border-brand-400 hover:text-brand-500 transition-colors px-1 relative">
                {compressingImage ? (
                  <span>Optimizando...</span>
                ) : (
                  <span>+ Agregar foto{images.length === 0 ? '' : 's'}</span>
                )}
                <input
                  type="file"
                  accept="image/*,.jfif,.heic,.heif"
                  multiple
                  onChange={handleImagesChange}
                  className="hidden"
                />
              </label>
            )}
          </div>
          {images.length === 0 && (
            <p className="text-xs text-slate-400 mt-2">
              Sin fotos, se muestra el ícono/emoji de abajo en su lugar. Podés subir hasta {MAX_IMAGES_PER_PRODUCT}.
            </p>
          )}
          {images.length > 1 && (
            <p className="text-[11px] text-slate-400 mt-2">
              Pasá el mouse sobre una foto para sacarla o marcarla como portada (⭐). La portada es la que se ve en el listado de la tienda.
            </p>
          )}
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="sm:col-span-2 lg:col-span-3">
            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
            <input name="name" required value={form.name} onChange={handleChange}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Categoría</label>
            <select name="category_id" value={form.category_id} onChange={handleChange}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-400">
              <option value="">Sin categoría</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Unidad</label>
            <select name="unit" value={form.unit} onChange={handleChange}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-400">
              <option value="un">Unidad</option>
              <option value="kg">Kilo</option>
              <option value="lt">Litro</option>
              <option value="ml">Mililitros</option>
              <option value="g">Gramos</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Proveedor</label>
            <select name="supplier_id" value={form.supplier_id} onChange={handleChange}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-400">
              <option value="">Sin proveedor asignado</option>
              {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Ícono (emoji, si no subís fotos)</label>
            <input name="icon" value={form.icon} onChange={handleChange}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-400" />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Precio</label>
            <input name="price" type="number" step="0.01" min="0" required value={form.price} onChange={handleChange}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Stock actual</label>
            <input name="stock" type="number" min="0" required value={form.stock} onChange={handleChange}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-400" />
            {editingId && (
              <p className="text-[11px] text-slate-400 mt-1">
                Para dejar registro de por qué cambió (compra, ajuste, merma), usá{' '}
                <Link to="/admin/stock" className="underline">Movimientos de stock</Link>.
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Stock mínimo</label>
            <input name="min_stock" type="number" min="0" value={form.min_stock} onChange={handleChange}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Etiqueta (opcional)</label>
            <input name="badge" placeholder="Ej: Oferta, 2x1" value={form.badge} onChange={handleChange}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-400" />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700 mt-6">
            <input type="checkbox" name="active" checked={form.active} onChange={handleChange} />
            Visible en la tienda
          </label>
        </div>

        {error && <p className="text-red-500 text-sm mt-3">{error}</p>}

        <div className="flex items-center gap-3 mt-5">
          <button type="submit" disabled={busy}
            className="bg-brand-500 hover:bg-brand-600 disabled:opacity-60 transition-colors text-white font-semibold px-6 py-2.5 rounded-lg">
            {compressingImage
              ? 'Optimizando imagen...'
              : uploadingImage
              ? 'Subiendo fotos...'
              : saving
              ? 'Guardando...'
              : editingId
              ? 'Guardar cambios'
              : 'Agregar producto'}
          </button>
          {editingId && (
            <button type="button" onClick={cancelEdit} className="text-slate-500 text-sm font-medium hover:text-navy">
              Cancelar edición
            </button>
          )}
        </div>
      </form>

      <div className="bg-white border border-slate-100 rounded-xl shadow-card overflow-x-auto">
        {loading ? (
          <p className="p-5 text-slate-400 text-sm">Cargando productos...</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-100">
                <th className="px-4 py-3">Producto</th>
                <th className="px-4 py-3">Categoría</th>
                <th className="px-4 py-3">Proveedor</th>
                <th className="px-4 py-3">Precio</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((p) => (
                <tr key={p.id} className={!p.active ? 'opacity-50' : ''}>
                  <td className="px-4 py-3 flex items-center gap-2 whitespace-nowrap">
                    <span className="w-8 h-8 rounded bg-slate-50 grid place-items-center overflow-hidden shrink-0 relative">
                      {p.image_url ? (
                        <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        <span>{p.icon}</span>
                      )}
                    </span>
                    {p.name}
                    {Array.isArray(p.images) && p.images.length > 1 && (
                      <span className="text-[10px] text-slate-400 font-medium">+{p.images.length - 1}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{categories.find((c) => c.id === p.category_id)?.name || '—'}</td>
                  <td className="px-4 py-3 text-slate-500">{suppliers.find((s) => s.id === p.supplier_id)?.name || '—'}</td>
                  <td className="px-4 py-3">$ {Number(p.price).toLocaleString('es-AR')}</td>
                  <td className="px-4 py-3">
                    <span className={p.stock < (p.min_stock ?? 5) ? 'text-red-500 font-semibold' : ''}>{p.stock}</span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleActive(p)}
                      className="text-xs font-medium underline text-slate-500 hover:text-navy"
                    >
                      {p.active ? 'Ocultar' : 'Mostrar'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button
                      onClick={() => startEdit(p)}
                      className="text-brand-500 font-medium mr-3 hover:underline"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => deleteProduct(p)}
                      className="text-red-500 font-medium hover:underline"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
