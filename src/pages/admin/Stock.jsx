import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'

const TYPES = [
  { value: 'compra', label: 'Ingreso por compra a proveedor', sign: 1 },
  { value: 'ajuste_positivo', label: 'Ajuste (sumar stock)', sign: 1 },
  { value: 'ajuste_negativo', label: 'Ajuste (restar stock)', sign: -1 },
  { value: 'merma', label: 'Merma / producto dañado', sign: -1 },
  { value: 'devolucion', label: 'Devolución de cliente', sign: 1 },
]

const TYPE_LABELS = Object.fromEntries(TYPES.map((t) => [t.value, t.label]))

export default function AdminStock() {
  const [products, setProducts] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [movements, setMovements] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [form, setForm] = useState({
    product_id: '',
    type: 'compra',
    quantity: '',
    supplier_id: '',
    note: '',
  })

  const load = async () => {
    setLoading(true)
    const [{ data: prods }, { data: provs }, { data: moves }] = await Promise.all([
      supabase.from('products').select('id, name, stock, min_stock').order('name'),
      supabase.from('suppliers').select('id, name').eq('active', true).order('name'),
      supabase
        .from('stock_movements')
        .select('*, products(name)')
        .order('created_at', { ascending: false })
        .limit(50),
    ])
    setProducts(prods || [])
    setSuppliers(provs || [])
    setMovements(moves || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
  }

  const lowStockProducts = products.filter((p) => p.stock < (p.min_stock ?? 5))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    const typeConfig = TYPES.find((t) => t.value === form.type)
    const qty = Number(form.quantity)
    if (!form.product_id || !qty || qty <= 0) {
      setError('Elegí un producto y una cantidad mayor a 0.')
      return
    }

    setSaving(true)
    const signedQty = qty * typeConfig.sign

    const { error: rpcError } = await supabase.rpc('adjust_stock', {
      p_product_id: Number(form.product_id),
      p_quantity_change: signedQty,
      p_type: form.type,
      p_note: form.note || null,
      p_supplier_id: form.supplier_id ? Number(form.supplier_id) : null,
    })

    setSaving(false)
    if (rpcError) {
      setError('No se pudo registrar el movimiento. ' + rpcError.message)
      return
    }

    setSuccess('Movimiento registrado y stock actualizado ✓')
    setForm({ product_id: '', type: 'compra', quantity: '', supplier_id: '', note: '' })
    setTimeout(() => setSuccess(''), 3000)
    load()
  }

  return (
    <div className="p-6 md:p-8">
      <h1 className="font-display font-800 text-2xl text-navy mb-6">Movimientos de stock</h1>

      {!loading && lowStockProducts.length > 0 && (
        <div className="bg-amber-50 border border-amber-100 text-amber-800 text-sm rounded-lg p-4 mb-6">
          <p className="font-semibold mb-1">⚠️ {lowStockProducts.length} producto(s) con stock bajo el mínimo:</p>
          <p>{lowStockProducts.map((p) => `${p.name} (${p.stock})`).join(' · ')}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white border border-slate-100 rounded-xl shadow-card p-5 mb-8">
        <h2 className="font-display font-700 text-navy mb-4">Registrar movimiento</h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Producto</label>
            <select name="product_id" required value={form.product_id} onChange={handleChange}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-400">
              <option value="">Elegí un producto</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.name} (stock actual: {p.stock})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de movimiento</label>
            <select name="type" value={form.type} onChange={handleChange}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-400">
              {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Cantidad</label>
            <input name="quantity" type="number" min="1" required value={form.quantity} onChange={handleChange}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Proveedor (opcional)</label>
            <select name="supplier_id" value={form.supplier_id} onChange={handleChange}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-400">
              <option value="">—</option>
              {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2 lg:col-span-5">
            <label className="block text-sm font-medium text-slate-700 mb-1">Nota (opcional)</label>
            <input name="note" placeholder="Ej: Factura #A-0001, reposición mensual" value={form.note} onChange={handleChange}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-400" />
          </div>
        </div>

        {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
        {success && <p className="text-fresh-600 text-sm mt-3">{success}</p>}

        <button type="submit" disabled={saving}
          className="mt-5 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 transition-colors text-white font-semibold px-6 py-2.5 rounded-lg">
          {saving ? 'Guardando...' : 'Registrar movimiento'}
        </button>
      </form>

      <div className="bg-white border border-slate-100 rounded-xl shadow-card overflow-x-auto">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-display font-700 text-navy">Historial reciente</h2>
        </div>
        {loading ? (
          <p className="p-5 text-slate-400 text-sm">Cargando movimientos...</p>
        ) : movements.length === 0 ? (
          <p className="p-5 text-slate-400 text-sm">Todavía no hay movimientos registrados.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-100">
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Producto</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Cantidad</th>
                <th className="px-4 py-3">Nota</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {movements.map((m) => (
                <tr key={m.id}>
                  <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                    {new Date(m.created_at).toLocaleString('es-AR')}
                  </td>
                  <td className="px-4 py-3 text-navy font-medium whitespace-nowrap">{m.products?.name || '—'}</td>
                  <td className="px-4 py-3 text-slate-500">{TYPE_LABELS[m.type] || m.type}</td>
                  <td className={`px-4 py-3 font-semibold ${m.quantity_change > 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {m.quantity_change > 0 ? '+' : ''}{m.quantity_change}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{m.note || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
