import { createBrowserClient, createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

// 创建服务器端的 Supabase 客户端
export function createClient(cookieStore: ReturnType<typeof cookies>) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options, maxAge: 0 })
        },
      },
    }
  )
}

// 创建浏览器端的 Supabase 客户端
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// 测试连接
export async function testConnection() {
  try {
    const { data, error } = await supabase
      .from('prompts')
      .select('count')
      .limit(1)
    
    if (error) throw error
    console.log('Database connection successful')
    return true
  } catch (error) {
    console.error('Database connection failed:', error)
    return false
  }
} 