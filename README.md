# Bella Uñas — Tienda online de insumos para uñas acrílicas

Tienda online hecha en **React + Vite + Tailwind**, con **Supabase** como base de datos
y pensada para desplegar en **Vercel**. Incluye catálogo por categorías, carrito de
compras, checkout con envío del pedido por WhatsApp o pago con Mercado Pago, panel de
administración con gestión de productos, stock, proveedores y pedidos.

## 1. Instalación local

```bash
npm install
cp .env.example .env
```

Completá `.env` con los datos de tu proyecto de Supabase (ver paso 2). Si dejás el
`.env` vacío, la tienda igual funciona con un catálogo de ejemplo (`src/data/mockData.js`)
para que puedas ver el diseño sin conectar nada todavía.

```bash
npm run dev
```

Abrí `http://localhost:5173`.

## 2. Configurar Supabase

1. Creá un proyecto en [supabase.com](https://supabase.com).
2. Andá a **SQL Editor** → **New query**, pegá el contenido de `supabase/schema.sql`
   y ejecutalo. Esto crea las tablas `categories`, `products`, `suppliers`,
   `stock_movements`, `orders`, `order_items`, configura los permisos (RLS) y carga
   algunos productos y proveedores de ejemplo.
3. Andá a **Project Settings → API** y copiá:
   - `Project URL` → pegalo en `VITE_SUPABASE_URL`
   - `anon public key` → pegalo en `VITE_SUPABASE_ANON_KEY`
4. Cargá tu catálogo real desde `/admin/productos`, o a mano desde el **Table Editor**
   de Supabase (Table Editor → products → Insert → Import data from CSV).

### Permisos (RLS)

Las políticas ya incluidas dejan:
- Cualquiera puede **leer** categorías y productos activos (para que la tienda cargue el catálogo).
- Los pedidos se crean a través de la función `create_order` (no con un `insert`
  directo), que recalcula los precios en el servidor así nadie puede pagar un
  pedido a un precio inventado editando el carrito en el navegador.
- Solo los usuarios dados de alta en `admin_users` pueden gestionar productos,
  proveedores, stock y pedidos (ver sección 8).

## 3. Números y datos a personalizar

- `src/lib/config.js`: reemplazá `WHATSAPP_NUMBER` por el número real del negocio
  (formato `54911XXXXXXXX`, sin espacios ni el "+"). Se usa en el botón flotante,
  el checkout y la página de contacto.
- `src/context/CartContext.jsx`: ajustá `FREE_SHIPPING_THRESHOLD` (monto para envío
  gratis) y `DELIVERY_FEE` (costo fijo de envío) según tu negocio. Si los cambiás,
  actualizá los mismos valores en `supabase/schema.sql` (función `create_order`,
  variables `v_free_shipping_threshold` y `v_delivery_fee`) para que lo que se le
  cobra al cliente coincida con lo que muestra la pantalla.
- `src/components/Hero.jsx`, `src/components/Benefits.jsx`,
  `src/pages/admin/Login.jsx`: usan tus propias fotos, guardadas en `/public`
  (`hero.avif`, `salon.avif`, `originales.avif`, `pagos.avif`, `atencion.avif`).
  Si en algún momento las querés cambiar, subí el archivo nuevo a `/public` y
  actualizá el nombre en el componente correspondiente.

## 4. Deploy en Vercel

1. Subí este proyecto a un repositorio de GitHub.
2. En [vercel.com](https://vercel.com) → **Add New Project** → importá el repo.
3. Framework preset: **Vite** (Vercel lo detecta solo).
4. En **Environment Variables** agregá:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - (y las de Mercado Pago si lo vas a usar, ver sección 7)
5. Deploy. El archivo `vercel.json` ya incluido asegura que las rutas de React Router
   (por ej. `/tienda`, `/producto/1`) funcionen bien al recargar la página.
6. **Dominio**: el sitio ya está configurado con `https://tiendabella.vercel.app`
   en `index.html`, `public/robots.txt` y `public/sitemap.xml` (ver sección 6).
   Si en algún momento conectás un dominio propio en Vercel, buscá y reemplazá
   `tiendabella.vercel.app` por el nuevo dominio en esos 3 archivos.

## Estructura del proyecto

```
src/
  components/       Header, TopBar, Hero, ProductCard, CategoryChips, Footer, Benefits, StoreLayout
  components/admin/ AdminLayout, ProtectedRoute
  pages/            Home, Shop, ProductDetail, Cart, Checkout, Contact
  pages/admin/      Login, Dashboard, Orders, Products, Suppliers, Stock (panel del dueño)
  context/          CartContext (carrito con localStorage), AuthContext (sesión admin)
  lib/              supabaseClient.js, catalog.js (lee de Supabase o del mock), config.js
  data/             mockData.js (catálogo de ejemplo)
supabase/
  schema.sql        Tablas, políticas RLS, funciones y datos de ejemplo
```

## 5. Seguridad — pasos obligatorios

### 5.1 Correr el `schema.sql` actualizado

Si ya habías corrido una versión anterior de `supabase/schema.sql`, volvé a
ejecutar el archivo completo en el SQL Editor. Es seguro: no borra tus datos,
solo agrega/actualiza tablas, columnas y políticas.

### 5.2 Dar de alta al administrador en `admin_users`

Además de crear el usuario en **Authentication → Users**, tenés que agregarlo a
la lista blanca:

1. Copiá el UUID del usuario desde Authentication → Users (columna "UID").
2. En el SQL Editor, corré:
   ```sql
   insert into admin_users (user_id) values ('PEGÁ-EL-UUID-ACÁ');
   ```
Sin este paso, ese usuario puede loguearse pero no va a poder ver ni editar
nada en `/admin` (las políticas RLS lo bloquean).

### 5.3 Desactivar el alta pública de usuarios

Andá a **Authentication → Providers → Email** y desactivá "Allow new users to
sign up". Así nadie puede crearse una cuenta por su cuenta desde la API pública.

### 5.4 Configurar el secreto del webhook de Mercado Pago (opcional pero recomendado)

En el panel de Mercado Pago Developers → tu aplicación → Webhooks, copiá la
"Clave secreta" y cargala como `MP_WEBHOOK_SECRET` en las variables de entorno
de Vercel. Con eso, `/api/mercadopago-webhook` verifica que la notificación
realmente vino de Mercado Pago antes de procesarla.

## 6. SEO y vista previa al compartir en WhatsApp

`index.html` ya incluye:
- Título y meta description optimizados con palabras clave del rubro (uñas
  acrílicas, nail art, esmalte semipermanente, etc.)
- Etiquetas **Open Graph** (`og:title`, `og:description`, `og:image`, `og:url`) y
  **Twitter Card** — son las que hace que al pegar el link de tu tienda en
  WhatsApp, Instagram o Facebook aparezca una tarjeta con imagen y descripción
  en vez del link pelado.
- Datos estructurados **JSON-LD** (tipo `Store`) para que Google entienda mejor
  de qué se trata el sitio.
- `public/robots.txt` y `public/sitemap.xml` para que Google indexe el sitio
  correctamente.

El dominio ya está configurado como `https://tiendabella.vercel.app` en esos
tres archivos (`index.html`, `robots.txt`, `sitemap.xml`). Si en algún momento
conectás un dominio propio en Vercel, reemplazá `tiendabella.vercel.app` por
el nuevo dominio en esos mismos archivos — con eso queda resuelto el SEO y la
vista previa de WhatsApp otra vez.

> ⚠️ Importante sobre `og:image`: tiene que ser una URL absoluta (empezar con
> `https://`) para que WhatsApp la pueda descargar. `public/og-image.jpg` ya
> es tu foto real del hero (1200x630, generada a partir de `hero.avif`).
> **Si Facebook Sharing Debugger muestra bien la vista previa pero en WhatsApp
> igual no aparece:** revisá el "Código de respuesta" que muestra el debugger.
> Si dice **206** (contenido parcial) en vez de 200, es un problema conocido
> de Vercel: por default sirve respuestas parciales cuando un bot pide solo
> un rango de bytes, y el rastreador de WhatsApp (a diferencia del de
> Facebook) no arma la vista previa con una respuesta 206. El `vercel.json`
> de este proyecto ya incluye una cabecera (`Accept-Ranges: none`) que
> fuerza siempre una respuesta completa (200) y soluciona esto — si de
> todos modos te sigue pasando, probá compartiendo la URL con un parámetro
> nuevo al final (ej. `?v=2`) para evitar la caché vieja de WhatsApp.

Para probar cómo se ve la vista previa antes de compartirlo de verdad, podés usar
el [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/) (WhatsApp
usa el mismo sistema de Open Graph) pegando la URL de tu tienda.

## 7. Fotos de productos

Desde `/admin/productos` podés subir una foto real para cada producto (además
del emoji, que queda como respaldo si el producto no tiene foto todavía). Las
imágenes se guardan en **Supabase Storage**, en un bucket público de solo
lectura llamado `product-images`.

Ese bucket y sus permisos ya se crean solos al correr `supabase/schema.sql`
(sección "Storage: fotos de productos"). Si por algún motivo no se creó,
podés armarlo a mano:

1. **Storage** → **New bucket** → nombre `product-images`, marcalo como **Public**.
2. Volvé a correr `supabase/schema.sql` completo para que se apliquen las
   políticas (solo los admins pueden subir/borrar, cualquiera puede ver).

Formatos aceptados: jpg, jfif, png, webp, heic y otros formatos de imagen
comunes. Tamaño máximo del archivo original: 8MB.

**Optimización automática:** antes de subir la foto, el navegador la
redimensiona (máximo 1400x1400px) y la convierte a WebP con calidad 82%
—así una foto de varios MB sacada con el celular termina pesando algunos
cientos de KB, sin que tengas que convertir nada a mano.

## 8. Panel de administración

La tienda incluye un panel en `/admin` para que el dueño del negocio pueda:
- Ver un resumen (pedidos pendientes, ventas del día/mes, productos con poco stock)
- Ver el listado de pedidos, abrir el detalle y cambiar el estado (pendiente → en
  camino → entregado, o cancelarlo)
- Agregar, editar, ocultar o eliminar productos del catálogo
- Gestionar **proveedores** (nombre, contacto, teléfono/WhatsApp, notas)
- Registrar **movimientos de stock** con motivo (compra a proveedor, ajuste,
  merma, devolución) — queda un historial completo y auditable

### Crear el usuario del dueño

1. En Supabase, andá a **Authentication → Users → Add user**.
2. Cargá el email y una contraseña (podés tildar "Auto Confirm User" para no
   depender del mail de confirmación).
3. Copiá el UUID de ese usuario y agregalo a la tabla `admin_users` (ver
   sección 5.2 más arriba) — sin este paso el login funciona pero el panel no
   deja ver ni editar nada.
4. Entrá a `https://tu-tienda.vercel.app/admin` (o `localhost:5173/admin` en local)
   e iniciá sesión con ese usuario.

Solo los usuarios dados de alta en `admin_users` tienen acceso al panel. Si
necesitás sumar un encargado más adelante, repetís el mismo paso 3 con su UUID.

También hay un enlace discreto "Acceso administrador" al pie de la tienda que
lleva directo a `/admin`.

## 9. Gestión de stock y proveedores

- **Stock mínimo por producto** (`min_stock`): en vez de un umbral fijo para
  todos los productos, cada uno tiene el suyo — así un producto que rotás
  rápido (ej. un esmalte muy vendido) puede tener un mínimo más alto que uno
  que se vende poco.
- **Proveedores** (`/admin/proveedores`): cargá tus proveedores con teléfono de
  WhatsApp, y asignalos a cada producto desde `/admin/productos`. Un producto
  no se puede vincular si el proveedor está inactivo o eliminado a menos que lo
  desvincules primero.
- **Movimientos de stock** (`/admin/stock`): en vez de editar el número de
  stock "a mano" sin dejar rastro, esta pantalla registra cada entrada/salida
  con motivo (compra, ajuste, merma, devolución), fecha y nota — así siempre
  podés reconstruir por qué el stock de un producto cambió. Las ventas de la
  tienda también generan un movimiento automático.
- Todo esto pasa por la función SQL `adjust_stock`, que actualiza `products.stock`
  y guarda el registro en `stock_movements` en la misma transacción — nunca
  quedan desincronizados.

## 10. Integrar Mercado Pago

El checkout deja elegir entre **transferencia** (se confirma por WhatsApp)
o **Mercado Pago** (Checkout Pro: el cliente paga con tarjeta, débito o dinero en
cuenta y vuelve a la tienda). El cobro se procesa con dos funciones serverless en
`/api`, así el access token nunca queda expuesto en el navegador.

### 10.1 Conseguir las credenciales

1. Entrá a [mercadopago.com.ar/developers/panel](https://www.mercadopago.com.ar/developers/panel) con la cuenta del negocio.
2. Creá una aplicación (o usá una existente) y copiá el **Access Token**:
   - Usá las credenciales de **prueba** mientras testeás (podés pagar con
     [tarjetas de prueba](https://www.mercadopago.com.ar/developers/es/docs/checkout-pro/additional-content/your-integrations/test/cards)).
   - Cuando esté todo probado, cambiá a las credenciales de **producción**.

### 10.2 Variables de entorno en Vercel

En **Project Settings → Environment Variables** de Vercel agregá (además de las de
Supabase del paso 2):

| Variable | Valor |
|---|---|
| `MP_ACCESS_TOKEN` | Access token de Mercado Pago |
| `MP_WEBHOOK_SECRET` | Clave secreta de webhooks de Mercado Pago (ver sección 5.4) |
| `SUPABASE_URL` | La misma URL que `VITE_SUPABASE_URL` |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key de Supabase (Project Settings → API → `service_role`, **secreta**, nunca la pongas con prefijo `VITE_`) |

La service role key es necesaria porque las funciones de `/api` necesitan poder
actualizar el pedido (estado del pago) sin depender de que el usuario esté logueado.

### 10.3 Cómo funciona el flujo

1. El cliente completa el checkout y elige "Mercado Pago".
2. Se guarda el pedido en Supabase con `payment_status = 'pendiente'`.
3. El frontend llama a `/api/create-preference`, que crea la preferencia de pago
   en Mercado Pago y devuelve la URL de pago (`init_point`).
4. El cliente paga en Mercado Pago y vuelve a `/pago-exitoso`, `/pago-fallido` o
   `/pago-pendiente` según el resultado.
5. En paralelo, Mercado Pago le avisa a `/api/mercadopago-webhook` el resultado
   real del pago (esto es lo confiable — las páginas de vuelta son solo para
   mostrarle algo al cliente). El webhook actualiza `payment_status` y guarda el
   `mp_payment_id` del pedido en Supabase.
6. Desde `/admin/pedidos` vas a poder ver el estado del pago de cada pedido.

### 10.4 Probar en local

Las funciones de `/api` no corren con `npm run dev` (eso solo levanta el
frontend). Para probarlas en tu máquina necesitás la CLI de Vercel:

```bash
npm install -g vercel
vercel dev
```

Como Mercado Pago necesita una URL pública para mandar el webhook, para probar el
webhook en local hace falta exponer tu `vercel dev` con algo como
[ngrok](https://ngrok.com) y configurar esa URL. Para probar el flujo de pago en
sí (sin depender del webhook), alcanza con tener el proyecto ya deployado en
Vercel con las variables de entorno cargadas.

## Próximos pasos sugeridos

- **Reportes de ventas por período** (semanal/mensual) y exportación a Excel/CSV.
- **Alertas automáticas por WhatsApp** cuando un producto llega a su stock mínimo.
- **Notificación de nuevo pedido**: conectar el evento de "nuevo pedido" con
  Supabase Realtime o un webhook a WhatsApp Business para avisar automáticamente
  cuando entra un pedido nuevo.
