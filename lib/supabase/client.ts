import { createBrowserClient } from '@supabase/ssr';
import { processLock } from '@supabase/auth-js';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        // Em PWA standalone/webview, o lock padrão (navigator.locks) pode ficar
        // pendurado e deixar getSession() sem resolver -> app preso no spinner.
        // processLock é um lock em memória que evita esse deadlock.
        lock: processLock,
      },
    }
  );
}

