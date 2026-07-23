-- Esquema de base de datos para Bella Uñas
-- Ejecutar en Supabase: Dashboard > SQL Editor > New query > pegar y correr.
-- Este script es seguro de re-ejecutar las veces que haga falta (usa
-- "if not exists" / "or replace" / "drop policy if exists" en todos lados).

-- 1) Categorías
create table if not exists categories (
  id text primary key,
  name text not null,
  icon text,
  created_at timestamptz default now()
);

-- 2) Proveedores
create table if not exists suppliers (
  id bigint generated always as identity primary key,
  name text not null,
  contact_name text,
  phone text,
  email text,
  notes text,
  active boolean not null default true,
  created_at timestamptz default now()
);

-- 3) Productos
create table if not exists products (
  id bigint generated always as identity primary key,
  name text not null,
  category_id text references categories(id) on delete set null,
  supplier_id bigint references suppliers(id) on delete set null,
  price numeric(10,2) not null,
  unit text not null default 'un',        -- 'un', 'kg', 'lt', 'ml', 'g', etc.
  stock integer not null default 0,
  min_stock integer not null default 5,   -- debajo de este número, se marca "stock bajo"
  icon text,                              -- emoji o url de imagen
  image_url text,                         -- si suben foto real a Supabase Storage
  badge text,                             -- ej: 'Oferta', '2x1'
  rating numeric(2,1) default 0,
  reviews integer default 0,
  active boolean not null default true,
  created_at timestamptz default now()
);

create index if not exists idx_products_category on products(category_id);
create index if not exists idx_products_active on products(active);
create index if not exists idx_products_supplier on products(supplier_id);

-- Migración: si ya tenías esta tabla de una versión anterior del proyecto
-- (por ejemplo, la que traía el bloqueo de suscripción), esto agrega las
-- columnas nuevas sin pisar nada de lo que ya tenías cargado.
alter table products add column if not exists supplier_id bigint references suppliers(id) on delete set null;
alter table products add column if not exists min_stock integer not null default 5;

-- 4) Pedidos
create table if not exists orders (
  id bigint generated always as identity primary key,
  customer_name text not null,
  customer_phone text not null,
  delivery_address text not null,
  notes text,
  payment_method text not null default 'efectivo', -- efectivo | transferencia | mercadopago
  payment_status text not null default 'no_aplica', -- no_aplica | pendiente | aprobado | rechazado
  mp_payment_id text,
  mp_preference_id text,
  subtotal numeric(10,2) not null,
  shipping numeric(10,2) not null default 0,
  total numeric(10,2) not null,
  status text not null default 'pendiente', -- pendiente | en_camino | entregado | cancelado
  created_at timestamptz default now()
);

-- 5) Ítems de cada pedido
create table if not exists order_items (
  id bigint generated always as identity primary key,
  order_id bigint references orders(id) on delete cascade,
  product_id bigint references products(id) on delete set null,
  product_name text not null,
  quantity integer not null,
  unit_price numeric(10,2) not null
);

-- 6) Lista blanca de administradores
-- No cualquier usuario logueado debe poder administrar el negocio: solo los
-- que están en esta tabla. Ver el paso "Alta del administrador" en el README.
create table if not exists admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz default now()
);

-- 7) Reseñas de productos (calificación real de clientes)
create table if not exists product_reviews (
  id bigint generated always as identity primary key,
  product_id bigint not null references products(id) on delete cascade,
  customer_name text not null,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz default now()
);

create index if not exists idx_reviews_product on product_reviews(product_id);

-- 8) Movimientos de stock (auditoría: quién metió/sacó stock y por qué)
create table if not exists stock_movements (
  id bigint generated always as identity primary key,
  product_id bigint not null references products(id) on delete cascade,
  supplier_id bigint references suppliers(id) on delete set null,
  type text not null, -- compra | ajuste_positivo | ajuste_negativo | merma | devolucion
  quantity_change integer not null, -- positivo = entra stock, negativo = sale stock
  note text,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

create index if not exists idx_stock_movements_product on stock_movements(product_id);
create index if not exists idx_stock_movements_created_at on stock_movements(created_at desc);

-- =========================================================
-- Row Level Security
-- =========================================================
alter table categories enable row level security;
alter table suppliers enable row level security;
alter table products enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table admin_users enable row level security;
alter table product_reviews enable row level security;
alter table stock_movements enable row level security;

-- Limpieza de políticas viejas (incluidas las de una versión anterior con
-- suscripción mensual, que ya no existe en este proyecto) para reemplazarlas
-- por las de abajo. Es seguro re-ejecutar todo este archivo las veces que
-- haga falta.
drop policy if exists "Cualquiera puede crear pedidos" on orders;
drop policy if exists "Cualquiera puede agregar items a un pedido" on order_items;
drop policy if exists "Categorías visibles para todos" on categories;
drop policy if exists "Admins pueden gestionar categorías" on categories;
drop policy if exists "Productos activos visibles para todos" on products;
drop policy if exists "Admins pueden gestionar productos" on products;
drop policy if exists "Admins pueden ver productos (panel)" on products;
drop policy if exists "Admins pueden crear productos si está al día" on products;
drop policy if exists "Admins pueden editar productos si está al día" on products;
drop policy if exists "Admins pueden eliminar productos si está al día" on products;
drop policy if exists "Admins pueden crear productos" on products;
drop policy if exists "Admins pueden editar productos" on products;
drop policy if exists "Admins pueden eliminar productos" on products;
drop policy if exists "Admins pueden ver pedidos" on orders;
drop policy if exists "Admins pueden actualizar pedidos" on orders;
drop policy if exists "Admins pueden ver y actualizar pedidos" on orders;
drop policy if exists "Admins pueden ver items de pedidos" on order_items;
drop policy if exists "Un usuario puede ver su propio registro en admin_users" on admin_users;
drop policy if exists "Admins pueden ver el estado de la suscripción" on subscription;
drop policy if exists "Reseñas visibles para todos" on product_reviews;
drop policy if exists "Cualquiera puede dejar una reseña" on product_reviews;
drop policy if exists "Admins pueden borrar reseñas" on product_reviews;

-- Lectura pública de catálogo (categorías y productos activos)
create policy "Categorías visibles para todos"
  on categories for select
  using (true);

create policy "Productos activos visibles para todos"
  on products for select
  using (active = true);

-- admin_users: un usuario solo puede ver si SU PROPIO id está en la lista
-- (no puede ver quiénes son los demás admins). Esta policy es necesaria:
-- sin ella, las políticas de más abajo (que hacen "exists (select 1 from
-- admin_users ...)") siempre dan falso para todos, porque esa sub-consulta
-- también queda sujeta a RLS de admin_users. Es un caso fácil de pasar por
-- alto — si en algún momento el panel te tira "row-level security policy"
-- al crear/editar/borrar algo estando ya logueado como admin, revisá
-- primero que esta policy exista.
create policy "Un usuario puede ver su propio registro en admin_users"
  on admin_users for select
  using (auth.uid() = user_id);

-- IMPORTANTE: a propósito NO hay policy de INSERT pública en `orders` ni
-- en `order_items`. El checkout ya no inserta filas directamente: llama a
-- la función `create_order` de más abajo, que calcula los precios del
-- lado del servidor (ver sección "Función create_order").

-- =========================================================
-- Panel de administración (solo usuarios en la tabla admin_users)
-- =========================================================
-- A diferencia de "cualquier usuario logueado", esto exige que el usuario
-- además esté dado de alta a mano en `admin_users` (ver README, sección
-- "Alta del administrador"). Así, si alguna vez queda habilitado el
-- registro público en Supabase Auth, un usuario nuevo NO consigue acceso
-- de administrador solo por crear una cuenta.

create policy "Admins pueden gestionar categorías"
  on categories for all
  using (exists (select 1 from admin_users a where a.user_id = auth.uid()))
  with check (exists (select 1 from admin_users a where a.user_id = auth.uid()));

create policy "Admins pueden gestionar proveedores"
  on suppliers for all
  using (exists (select 1 from admin_users a where a.user_id = auth.uid()))
  with check (exists (select 1 from admin_users a where a.user_id = auth.uid()));

create policy "Admins pueden gestionar productos"
  on products for all
  using (exists (select 1 from admin_users a where a.user_id = auth.uid()))
  with check (exists (select 1 from admin_users a where a.user_id = auth.uid()));

create policy "Admins pueden ver pedidos"
  on orders for select
  using (exists (select 1 from admin_users a where a.user_id = auth.uid()));

create policy "Admins pueden actualizar pedidos"
  on orders for update
  using (exists (select 1 from admin_users a where a.user_id = auth.uid()))
  with check (exists (select 1 from admin_users a where a.user_id = auth.uid()));

create policy "Admins pueden ver items de pedidos"
  on order_items for select
  using (exists (select 1 from admin_users a where a.user_id = auth.uid()));

-- El stock solo se toca a través de la función adjust_stock (ver más abajo,
-- corre con permisos elevados y deja registro en stock_movements), así que
-- acá solo hace falta permiso de LECTURA para admins.
create policy "Admins pueden ver movimientos de stock"
  on stock_movements for select
  using (exists (select 1 from admin_users a where a.user_id = auth.uid()));

-- =========================================================
-- Función adjust_stock: única forma soportada de cambiar el stock de un
-- producto. Actualiza `products.stock` Y deja registro en
-- `stock_movements` en la misma transacción, así el historial de stock
-- siempre coincide con el stock real (nunca quedan desincronizados).
-- =========================================================
create or replace function adjust_stock(
  p_product_id bigint,
  p_quantity_change integer, -- positivo = entra stock, negativo = sale stock
  p_type text,
  p_note text default null,
  p_supplier_id bigint default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_new_stock integer;
begin
  if not exists (select 1 from admin_users where user_id = auth.uid()) then
    raise exception 'No autorizado';
  end if;

  if p_quantity_change is null or p_quantity_change = 0 then
    raise exception 'La cantidad no puede ser 0';
  end if;

  if p_type not in ('compra', 'ajuste_positivo', 'ajuste_negativo', 'merma', 'devolucion') then
    raise exception 'Tipo de movimiento inválido';
  end if;

  update products
    set stock = stock + p_quantity_change
    where id = p_product_id
    returning stock into v_new_stock;

  if v_new_stock is null then
    raise exception 'Producto no encontrado';
  end if;

  if v_new_stock < 0 then
    raise exception 'El stock resultante no puede ser negativo (quedaría en %)', v_new_stock;
  end if;

  insert into stock_movements (product_id, supplier_id, type, quantity_change, note, created_by)
  values (p_product_id, p_supplier_id, p_type, p_quantity_change, p_note, auth.uid());

  return jsonb_build_object('new_stock', v_new_stock);
end;
$$;

grant execute on function adjust_stock(bigint, integer, text, text, bigint) to authenticated;

-- =========================================================
-- Función create_order: el checkout llama a esta función en vez de
-- insertar directamente. Recalcula los precios leyendo la tabla
-- `products` (nunca confía en lo que mande el navegador), así nadie
-- puede pagar un pedido a un precio inventado. También descuenta el
-- stock vendido automáticamente.
-- =========================================================
create or replace function create_order(
  p_customer_name text,
  p_customer_phone text,
  p_delivery_address text,
  p_notes text,
  p_payment_method text,
  p_items jsonb  -- [{"product_id": 1, "quantity": 2}, ...]
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item jsonb;
  v_product products%rowtype;
  v_qty integer;
  v_subtotal numeric(10,2) := 0;
  v_shipping numeric(10,2) := 0;
  v_total numeric(10,2) := 0;
  v_order_id bigint;
  -- Mismas reglas de envío que en el frontend (CartContext), pero acá
  -- son la fuente de verdad real: si las cambiás, cambialas en los dos
  -- lugares para que la UI muestre lo mismo que se termina cobrando.
  v_free_shipping_threshold numeric(10,2) := 15000;
  v_delivery_fee numeric(10,2) := 1200;
begin
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'El pedido no tiene productos';
  end if;

  if p_payment_method not in ('efectivo', 'transferencia', 'mercadopago') then
    raise exception 'Método de pago inválido';
  end if;

  if coalesce(trim(p_customer_name), '') = '' or coalesce(trim(p_customer_phone), '') = ''
     or coalesce(trim(p_delivery_address), '') = '' then
    raise exception 'Faltan datos del cliente';
  end if;

  insert into orders (
    customer_name, customer_phone, delivery_address, notes, payment_method,
    subtotal, shipping, total, status, payment_status
  )
  values (
    p_customer_name, p_customer_phone, p_delivery_address, p_notes, p_payment_method,
    0, 0, 0, 'pendiente',
    case when p_payment_method = 'mercadopago' then 'pendiente' else 'no_aplica' end
  )
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_qty := (v_item->>'quantity')::integer;
    if v_qty is null or v_qty <= 0 or v_qty > 100 then
      raise exception 'Cantidad inválida para un producto';
    end if;

    select * into v_product from products
      where id = (v_item->>'product_id')::bigint and active = true;

    if not found then
      raise exception 'Un producto del pedido ya no está disponible';
    end if;

    if v_product.stock < v_qty then
      raise exception 'No hay stock suficiente de "%": quedan %', v_product.name, v_product.stock;
    end if;

    insert into order_items (order_id, product_id, product_name, quantity, unit_price)
    values (v_order_id, v_product.id, v_product.name, v_qty, v_product.price);

    update products set stock = stock - v_qty where id = v_product.id;

    insert into stock_movements (product_id, type, quantity_change, note, created_by)
    values (v_product.id, 'ajuste_negativo', -v_qty, 'Venta — pedido #' || v_order_id, null);

    v_subtotal := v_subtotal + (v_product.price * v_qty);
  end loop;

  v_shipping := case when v_subtotal >= v_free_shipping_threshold then 0 else v_delivery_fee end;
  v_total := v_subtotal + v_shipping;

  update orders set subtotal = v_subtotal, shipping = v_shipping, total = v_total
    where id = v_order_id;

  return jsonb_build_object(
    'order_id', v_order_id,
    'subtotal', v_subtotal,
    'shipping', v_shipping,
    'total', v_total
  );
end;
$$;

-- El público (anon) y usuarios logueados pueden ejecutar la función, pero
-- NO pueden insertar directamente en las tablas (no hay policy de insert
-- para ellos). security definer hace que la función corra con permisos
-- para escribir igual, ya validados los datos adentro.
grant execute on function create_order(text, text, text, text, text, jsonb) to anon, authenticated;

-- =========================================================
-- Storage: fotos de productos
-- Bucket público de solo-lectura (cualquiera puede VER las fotos, como
-- corresponde a una tienda), pero solo los admins pueden subir/borrar.
-- =========================================================
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

drop policy if exists "Fotos de productos son públicas" on storage.objects;
drop policy if exists "Admins pueden subir fotos de productos" on storage.objects;
drop policy if exists "Admins pueden actualizar fotos de productos" on storage.objects;
drop policy if exists "Admins pueden borrar fotos de productos" on storage.objects;

create policy "Fotos de productos son públicas"
  on storage.objects for select
  using (bucket_id = 'product-images');

create policy "Admins pueden subir fotos de productos"
  on storage.objects for insert
  with check (
    bucket_id = 'product-images'
    and exists (select 1 from admin_users a where a.user_id = auth.uid())
  );

create policy "Admins pueden actualizar fotos de productos"
  on storage.objects for update
  using (
    bucket_id = 'product-images'
    and exists (select 1 from admin_users a where a.user_id = auth.uid())
  )
  with check (
    bucket_id = 'product-images'
    and exists (select 1 from admin_users a where a.user_id = auth.uid())
  );

create policy "Admins pueden borrar fotos de productos"
  on storage.objects for delete
  using (
    bucket_id = 'product-images'
    and exists (select 1 from admin_users a where a.user_id = auth.uid())
  );

-- =========================================================
-- Reseñas de productos
-- =========================================================
-- Cualquiera puede leer las reseñas (se muestran en la página del producto).
create policy "Reseñas visibles para todos"
  on product_reviews for select
  using (true);

-- Cualquiera puede dejar una reseña (no exigimos login para no complicar
-- la compra), pero validamos que traiga nombre y que el comentario no sea
-- gigante. No hay policy de update/delete pública: una vez publicada, un
-- cliente no puede editar ni borrar reseñas ajenas ni propias.
create policy "Cualquiera puede dejar una reseña"
  on product_reviews for insert
  with check (
    char_length(trim(customer_name)) > 0
    and char_length(coalesce(comment, '')) <= 500
  );

-- Los admins sí pueden borrar una reseña (por ejemplo, si es spam o
-- contenido inapropiado) desde el SQL Editor o, más adelante, desde un
-- panel de moderación.
create policy "Admins pueden borrar reseñas"
  on product_reviews for delete
  using (exists (select 1 from admin_users a where a.user_id = auth.uid()));

-- Trigger: cada vez que se agrega, edita o borra una reseña, recalculamos
-- el promedio (`rating`) y el total (`reviews`) del producto. Así el
-- listado de la tienda (que lee esas dos columnas directo de `products`
-- para no tener que sumar reseñas en cada carga) siempre está al día.
create or replace function update_product_rating()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_product_id bigint;
begin
  v_product_id := coalesce(new.product_id, old.product_id);

  update products
    set rating = coalesce(
          (select round(avg(rating)::numeric, 1) from product_reviews where product_id = v_product_id),
          0
        ),
        reviews = (select count(*) from product_reviews where product_id = v_product_id)
    where id = v_product_id;

  return null;
end;
$$;

drop trigger if exists trg_update_product_rating on product_reviews;
create trigger trg_update_product_rating
  after insert or update or delete on product_reviews
  for each row execute function update_product_rating();

-- =========================================================
-- Limpieza de una versión anterior (suscripción mensual): si ya habías
-- corrido un schema.sql viejo que tenía la tabla `subscription`, esto la
-- elimina junto con su función auxiliar. Si nunca existió, no hace nada.
-- =========================================================
drop function if exists is_subscription_active();
drop function if exists request_subscription_verification(text);
drop table if exists subscription;

-- =========================================================
-- Datos de ejemplo (opcional, podés borrar esta sección)
-- Están armados para no duplicarse si volvés a correr este script.
-- =========================================================
insert into categories (id, name, icon) values
  ('acrilico', 'Acrílicos', '💅'),
  ('semipermanente', 'Esmaltes Semipermanentes', '💄'),
  ('nailart', 'Nail Art y Decoración', '✨'),
  ('herramientas', 'Herramientas y Limas', '🛠️'),
  ('lamparas', 'Lámparas UV/LED', '💡'),
  ('cuidado', 'Cuidado de Cutículas', '🧴'),
  ('tips', 'Tips y Moldes', '🗂️'),
  ('kits', 'Kits Completos', '🎁')
on conflict (id) do nothing;

insert into suppliers (name, contact_name, phone, notes)
select * from (values
  ('Distribuidora NailPro', 'Marina Ríos', '5491133334444', 'Acrílicos y monómeros'),
  ('Belleza Total SRL', 'Julián Paz', '5491144445555', 'Esmaltes semipermanentes y accesorios')
) as seed(name, contact_name, phone, notes)
where not exists (select 1 from suppliers s where s.name = seed.name);

insert into products (name, category_id, price, unit, stock, min_stock, icon, badge, rating, reviews)
select * from (values
  ('Polvo acrílico rosa nude 30g', 'acrilico', 8990, 'un', 22, 5, '💅', 'Más vendido', 4.8, 64),
  ('Monómero líquido premium 250ml', 'acrilico', 12490, 'un', 15, 5, '🧪', null, 4.6, 37),
  ('Esmalte semipermanente nude x15ml', 'semipermanente', 5490, 'un', 45, 10, '💄', 'Oferta', 4.8, 132),
  ('Top coat sellador brillante 15ml', 'semipermanente', 4990, 'un', 40, 10, '✨', null, 4.9, 156),
  ('Lámpara UV/LED 48W profesional', 'lamparas', 28990, 'un', 12, 3, '💡', 'Top', 4.8, 84),
  ('Kit iniciación acrílico completo', 'kits', 42990, 'un', 10, 3, '🎁', 'Más vendido', 4.9, 112)
) as seed(name, category_id, price, unit, stock, min_stock, icon, badge, rating, reviews)
where not exists (
  select 1 from products p where p.name = seed.name
);
