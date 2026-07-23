import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'

const EMPTY_FORM = { name: '', contact_name: '', phone: '', email: '', notes: '', active: true }

export default function AdminSuppliers() {
  const [suppliers, setSuppliers] = useState([])
  const [productCounts, setProductCounts] = useState({})
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    const [{ data: provs }, { data: prods }] = await Promise.all([
      supabase.from('suppliers').select('*').order('name'),
      supabase.from('products').select('supplier_id'),
    ])
    setSuppliers(provs || [])
    const counts = {}
    for (const p of prods || []) {
      if (!p.supplier_id) continue
      counts[p.supplier_id] = (counts[p.supplier_id] || 0) + 1
    }
    setProductCounts(counts)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
  }

  const startEdit = (s) => {
    setEditingId(s.id)
    setForm({
      name: s.name,
      contact_name: s.contact_name || '',
      phone: s.phone || '',
      email: s.email || '',
      notes: s.notes || '',
      active: s.active,
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    const payload = {
      name: form.name,
      contact_name: form.contact_name || null,
      phone: form.phone || null,
      email: form.email || null,
      notes: form.notes || null,
      active: form.active,
    }

    const { error } = editingId
      ? await supabase.from('suppliers').update(payload).eq('id', editingId)
      : await supabase.from('suppliers').insert(payload)

    setSaving(false)
    if (error) {
      setError('No se pudo guardar el proveedor. ' + error.message)
      return
    }
    cancelEdit()
    load()
  }

  const deleteSupplier = async (s) => {
    if (productCounts[s.id]) {
      alert(
        `No podés eliminar "${s.name}" porque tiene ${productCounts[s.id]} producto(s) asociado(s). Desvinculalos primero o marcalo como inactivo.`,
      )
      return
    }
    if (!confirm(`¿Eliminar el proveedor "${s.name}"?`)) return
    await supabase.from('suppliers').delete().eq('id', s.id)
    load()
  }

  const whatsappLink = (phone) => {
    if (!phone) return null
    const digits = phone.replace(/[^\d]/g, '')
    if (!digits) return null
    return `https://wa.me/${digits}`
  }

  return (
    <div className="p-6 md:p-8">
      <h1 className="font-display font-800 text-2xl text-navy mb-6">Proveedores</h1>

      <form onSubmit={handleSubmit} className="bg-white border border-slate-100 rounded-xl shadow-card p-5 mb-8">
        <h2 className="font-display font-700 text-navy mb-4">
          {editingId ? `Editando proveedor #${editingId}` : 'Agregar proveedor nuevo'}
        </h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre / razón social</label>
            <input name="name" required value={form.name} onChange={handleChange}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Persona de contacto</label>
            <input name="contact_name" value={form.contact_name} onChange={handleChange}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono / WhatsApp</label>
            <input name="phone" placeholder="5491122223333" value={form.phone} onChange={handleChange}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input name="email" type="email" value={form.email} onChange={handleChange}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-400" />
          </div>
          <div className="sm:col-span-2 lg:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Notas (marcas que provee, condiciones, etc.)</label>
            <input name="notes" value={form.notes} onChange={handleChange}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-400" />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700 mt-6">
            <input type="checkbox" name="active" checked={form.active} onChange={handleChange} />
            Proveedor activo
          </label>
        </div>

        {error && <p className="text-red-500 text-sm mt-3">{error}</p>}

        <div className="flex items-center gap-3 mt-5">
          <button type="submit" disabled={saving}
            className="bg-brand-500 hover:bg-brand-600 disabled:opacity-60 transition-colors text-white font-semibold px-6 py-2.5 rounded-lg">
            {saving ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Agregar proveedor'}
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
          <p className="p-5 text-slate-400 text-sm">Cargando proveedores...</p>
        ) : suppliers.length === 0 ? (
          <p className="p-5 text-slate-400 text-sm">Todavía no cargaste proveedores.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-100">
                <th className="px-4 py-3">Proveedor</th>
                <th className="px-4 py-3">Contacto</th>
                <th className="px-4 py-3">Teléfono</th>
                <th className="px-4 py-3">Productos</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {suppliers.map((s) => (
                <tr key={s.id} className={!s.active ? 'opacity-50' : ''}>
                  <td className="px-4 py-3 font-medium text-navy whitespace-nowrap">{s.name}</td>
                  <td className="px-4 py-3 text-slate-500">{s.contact_name || '—'}</td>
                  <td className="px-4 py-3 text-slate-500">
                    {s.phone ? (
                      <a href={whatsappLink(s.phone)} target="_blank" rel="noreferrer" className="text-brand-500 hover:underline">
                        {s.phone}
                      </a>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{productCounts[s.id] || 0}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${s.active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                      {s.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button onClick={() => startEdit(s)} className="text-brand-500 font-medium mr-3 hover:underline">
                      Editar
                    </button>
                    <button onClick={() => deleteSupplier(s)} className="text-red-500 font-medium hover:underline">
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
