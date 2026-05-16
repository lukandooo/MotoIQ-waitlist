import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import type { StringValidation } from 'astro:schema';

export const prerender = false;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALLOWED_SCALES = ['1-4', '5-15', '16-30', '30+', 'importer', 'inne'];

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json().catch(() => null);
    if (!body) return json({ error: 'Nieprawidłowe dane.' }, 400);

    const { name, email, phone, scale, company } = body as {
      name?: string;
      email?: string;
      phone?: string;
      scale?: string;
      company?: string;
    };

    // Honeypot — bots fill this. Pretend success.
    if (company && company.trim() !== '') {
      return json({ ok: true }, 200);
    }

    // Validate
    const cleanName = (name || '').trim().slice(0, 80);
    const cleanEmail = (email || '').trim().toLowerCase().slice(0, 200);
    const cleanPhone = (phone || '').trim().slice(0, 30);
    const cleanScale = (scale || '').trim();

    if (!cleanName) return json({ error: 'Podaj imię.' }, 400);
    if (!EMAIL_RE.test(cleanEmail)) return json({ error: 'Niepoprawny email.' }, 400);
    if (!ALLOWED_SCALES.includes(cleanScale)) {
      return json({ error: 'Wybierz skalę działalności.' }, 400);
    }

    // Env from Cloudflare runtime
    const env = (locals as any).runtime?.env ?? import.meta.env;
    const url = env.SUPABASE_URL;
    const key = env.SUPABASE_SERVICE_KEY;

    if (!url || !key) {
      console.error('Missing Supabase env');
      return json({ error: 'Serwer nieskonfigurowany.' }, 500);
    }

    const supabase = createClient(url, key, {
      auth: { persistSession: false },
    });

    const { error } = await supabase
      .from('waitlist')
      .insert({
        name: cleanName,
        email: cleanEmail,
        phone: cleanPhone || null,
        scale: cleanScale,
      });

    if (error) {
      // Unique violation = already on the list
      if (error.code === '23505') {
        return json({ ok: true, already: true }, 200);
      }
      console.error(error);
      return json({ error: 'Nie udało się zapisać. Spróbuj za chwilę.' }, 500);
    }

    return json({ ok: true }, 200);
  } catch (err) {
    console.error(err);
    return json({ error: 'Błąd serwera.' }, 500);
  }
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
