import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware(async (context, next) => {
  const host = context.request.headers.get('host') ?? '';

  // Redirect motoiq.app (and www.motoiq.app) → motoiq.eu
  if (host.includes('motoiq.app')) {
    const url = new URL(context.request.url);
    url.hostname = 'motoiq.eu';
    return Response.redirect(url.toString(), 301);
  }

  return next();
});
