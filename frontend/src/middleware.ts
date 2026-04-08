import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Obtém o usuário logado
  const { data: { user } } = await supabase.auth.getUser()

  const isLoginPage = request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/' || request.nextUrl.pathname === '/admin-login'
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin') && request.nextUrl.pathname !== '/admin-login'

  // Se NÃO está logado mas quer ver páginas privadas, mandar pro login
  // NOTA: Como o sistema é misto, o aluno vê rotas de aluno e admin vê admin.
  if (!user && !isLoginPage) {
    const url = request.nextUrl.clone()
    // Se tentou acessar algo do admin, joga pro admin-login. Senão, joga pro login normal.
    url.pathname = isAdminRoute ? '/admin-login' : '/login'
    return NextResponse.redirect(url)
  }

  // Se o usuário está logado
  if (user) {
    // 1. Buscamos a info completa (ROLE e IS_ACTIVE) no PROFILE
    const { data: profile } = await supabase.from('profiles').select('role, is_active').eq('id', user.id).single()
    const userRole = profile?.role || 'aluno'
    const isActive = profile?.is_active ?? true

    // Se a conta estiver bloqueada pelo Admin
    if (!isActive && !isLoginPage) {
        // Podem ser redirecionados para uma futura tela /bloqueado
        // Por ora, matamos a sessão (opcional) e redirecionamos ao login com status clear
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    // Se estiver logado tentando entrar no login, envia pro painel
    if (isLoginPage) {
      if (userRole === 'admin') {
        const url = request.nextUrl.clone()
        url.pathname = '/admin'
        return NextResponse.redirect(url)
      } else {
        const url = request.nextUrl.clone()
        url.pathname = '/home'
        return NextResponse.redirect(url)
      }
    }

    // Se é Aluno tentando acessar /admin, trava ele
    if (userRole !== 'admin' && isAdminRoute) {
      const url = request.nextUrl.clone()
      url.pathname = '/home' // Manda pro painel do aluno
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Intercepta tudo em /admin, /redacao, /home etc
     * Exclui API, _next/static, _next/image, favicon.ico, etc.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
