import { createServerClient, type CookieOptions } from '@supabase/ssr'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  console.log('Middleware checking path:', pathname)

  // 跳过登录和注册页面的验证
  if (pathname === '/login' || pathname === '/register') {
    return NextResponse.next()
  }

  let response = NextResponse.next()

  // 创建 supabase 客户端
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value,
            ...options,
            path: '/',
          })
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value: '',
            ...options,
            path: '/',
            maxAge: 0
          })
        },
      },
    }
  )

  // 获取当前用户
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error) {
    console.error('User authentication error:', error)
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (!user) {
    console.log('No authenticated user found, redirecting to login')
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // 确保用户ID是有效的UUID
  const userId = user.id
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(userId)) {
    console.error('Invalid user ID format:', userId)
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // 将用户ID添加到请求头中
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-user-id', userId)

  // 继续请求，但包含新的请求头
  response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })

  return response
}

// 配置需要进行中间件检查的路径
export const config = {
  matcher: [
    /*
     * 匹配所有路径，除了:
     * - api/auth (登录注册API)
     * - _next (Next.js 系统文件)
     * - 静态文件 (图片等)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
    '/api/prompts/:path*'  // 确保 /api/prompts 路径被中间件处理
  ],
} 