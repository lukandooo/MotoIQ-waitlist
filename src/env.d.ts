/// <reference path="../.astro/types.d.ts" />

type Runtime = import('@astrojs/cloudflare').Runtime<Env>;

declare namespace App {
  interface Locals extends Runtime {}
}

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
}
