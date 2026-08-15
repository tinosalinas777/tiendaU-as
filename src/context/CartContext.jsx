import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'

const CartContext = createContext(null)
const STORAGE_KEY = 'bella-unas-cart'

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items])

  const addItem = (product, qty = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === product.id)
      if (existing) {
        return prev.map((i) => (i.id === product.id ? { ...i, qty: i.qty + qty } : i))
      }
      return [...prev, { id: product.id, name: product.name, price: product.price, unit: product.unit, icon: product.icon, image_url: product.image_url, qty }]
    })
  }

  const updateQty = (id, qty) => {
    if (qty <= 0) {
      removeItem(id)
      return
    }
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, qty } : i)))
  }

  const removeItem = (id) => setItems((prev) => prev.filter((i) => i.id !== id))

  const clearCart = () => setItems([])

  const subtotal = useMemo(() => items.reduce((sum, i) => sum + i.price * i.qty, 0), [items])
  const itemCount = useMemo(() => items.reduce((sum, i) => sum + i.qty, 0), [items])

  // Envío gratis a partir de cierto monto; si no, costo fijo de envío.
  // DELIVERY_FEE = costo real cotizado en Andreani para un paquete
  // 20x20x20cm / 1kg (agosto 2026).
  // FREE_SHIPPING_THRESHOLD: se calculó con la lista de precios de la
  // distribuidora — el margen promedio entre precio de venta sugerido y
  // precio de costo ronda el 35%. Para que ese margen alcance a cubrir
  // el envío de $10.000, el pedido necesita ser de al menos ~$28.500
  // (10000 / 0.35). Se dejó en $45.000 (~2-3 productos a precio
  // promedio) para tener margen de sobra y no solo empatar.
  // IMPORTANTE: estos dos valores deben coincidir siempre con
  // v_free_shipping_threshold y v_delivery_fee en supabase/schema.sql
  // (función create_order), que es la fuente de verdad real del cobro.
  const FREE_SHIPPING_THRESHOLD = 45000
  const DELIVERY_FEE = 10000
  const shipping = items.length === 0 ? 0 : subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : DELIVERY_FEE
  const total = subtotal + shipping

  const value = {
    items,
    addItem,
    updateQty,
    removeItem,
    clearCart,
    subtotal,
    shipping,
    total,
    itemCount,
    FREE_SHIPPING_THRESHOLD,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart debe usarse dentro de <CartProvider>')
  return ctx
}
