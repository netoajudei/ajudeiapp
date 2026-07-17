import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Middleware do @supabase/ssr: renova o token de acesso e reescreve os cookies
// de sessão a cada navegação. Sem isso, a sessão expira em 1h (jwt_expiry) e o
// usuário é jogado de volta ao login. Aqui NÃO há redirecionamento — apenas a
// renovação da sessão. O controle de acesso continua no ProtectedRoute.
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // getUser() força a renovação do token quando necessário e persiste os cookies.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    // Roda em tudo, exceto assets estáticos, imagens e arquivos do PWA.
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
