import { next } from "@vercel/functions";

// Por qué existe este archivo:
// Vercel por default responde con HTTP 206 (contenido parcial) cuando una
// petición trae un header "Range" — esto es normal y bueno para videos o
// descargas grandes. El problema es que el rastreador que arma la vista
// previa de links en WhatsApp pide las páginas con ese header, y a
// diferencia del rastreador de Facebook (que es más tolerante), si recibe
// un 206 en vez de un 200 simplemente no arma la tarjeta con foto/título/
// descripción — aunque el contenido esté completo y sea válido.
//
// Esta Routing Middleware corre ANTES de que la petición llegue a la capa
// de archivos estáticos de Vercel, y le saca el header "Range" a la
// petición entrante. Así, esa capa nunca se entera de que alguien pidió
// un rango de bytes, y siempre responde 200 con el archivo completo.
//
// Se aplica a todas las rutas menos /api (las funciones de pago no
// necesitan esto).
export const config = {
  matcher: ["/((?!api/).*)"],
};

export default function middleware(request) {
  const headers = new Headers(request.headers);
  headers.delete("range");
  return next({ request: { headers } });
}
