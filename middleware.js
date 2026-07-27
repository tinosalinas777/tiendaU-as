import { next } from "@vercel/functions";

// Por qué existe este archivo:
// Vercel por default responde con HTTP 206 (contenido parcial) cuando una
// petición trae un header "Range" — esto pasa a nivel de la capa de
// archivos estáticos/CDN, y sacarle el header Range a la petición (lo que
// hacíamos antes acá) NO alcanza para evitarlo: esa capa igual puede
// aplicar el recorte más abajo en la cadena. El rastreador que arma la
// vista previa de links en WhatsApp (a diferencia del de Facebook, más
// tolerante) directamente no arma la tarjeta si recibe un 206 en vez de
// un 200 — aunque el contenido esté completo y sea válido.
//
// La solución: cuando la petición viene de uno de estos bots, en vez de
// dejar que la sirva la capa de archivos estáticos (donde puede pasar el
// 206), el propio middleware pide el archivo internamente (sin header
// Range) y arma una respuesta 100% nueva con status 200 fijo. Esa
// respuesta la genera nuestro código, así que Vercel ya no tiene margen
// para "recortarla" — se manda tal cual al bot.
//
// Para evitar que ese pedido interno vuelva a entrar en este mismo
// middleware (y quede pidiéndose a sí mismo en bucle infinito), lo
// marcamos con el header "x-mw-bypass": si lo vemos, no lo reprocesamos.

export const config = {
  matcher: ["/((?!api/).*)"],
};

const BOT_USER_AGENT = new RegExp(
  [
    "facebookexternalhit",
    "WhatsApp",
    "Twitterbot",
    "LinkedInBot",
    "Slackbot",
    "TelegramBot",
    "Discordbot",
    "SkypeUriPreview",
    "Pinterest",
    "redditbot",
    "Applebot",
    "vkShare",
  ].join("|"),
  "i",
);

export default async function middleware(request) {
  // Pedido interno nuestro (ver más abajo): lo dejamos pasar tal cual,
  // sin volver a evaluar nada, para no entrar en bucle.
  if (request.headers.get("x-mw-bypass") === "1") {
    return next();
  }

  const userAgent = request.headers.get("user-agent") || "";

  if (BOT_USER_AGENT.test(userAgent)) {
    const url = new URL(request.url);
    // Todas las rutas de la tienda (/, /tienda, /producto/1, etc.) sirven
    // el mismo index.html con los mismos meta tags — así que para
    // cualquier ruta que no sea un archivo real (imagen, css, js), le
    // pedimos directamente index.html.
    const looksLikeStaticFile = /\.[a-z0-9]+$/i.test(url.pathname);
    if (!looksLikeStaticFile) {
      url.pathname = "/index.html";
    }

    const originResponse = await fetch(url, {
      headers: { "x-mw-bypass": "1" }, // pedido limpio, sin Range
    });
    const body = await originResponse.arrayBuffer();

    return new Response(body, {
      status: 200,
      headers: {
        "content-type":
          originResponse.headers.get("content-type") ||
          "application/octet-stream",
        "cache-control": "public, max-age=300",
      },
    });
  }

  // Visitantes normales (navegadores): seguimos igual que siempre.
  const headers = new Headers(request.headers);
  headers.delete("range");
  return next({ request: { headers } });
}

