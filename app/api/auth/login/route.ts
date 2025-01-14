import { createClient } from '@/lib/supabase'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  console.log('Login API called')
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  try {
    // 解析请求数据
    let email, password
    try {
      const body = await request.json()
      email = body.email
      password = body.password
    } catch (parseError) {
      console.error('Request parsing error:', parseError)
      return new NextResponse(
        JSON.stringify({ error: '无效的请求数据' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('Login attempt for email:', email)
    
    if (!email || !password) {
      console.log('Missing email or password')
      return new NextResponse(
        JSON.stringify({ error: '邮箱和密码不能为空' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // 使用 Supabase Auth 进行登录
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      console.error('Login error:', error)
      return new NextResponse(
        JSON.stringify({ 
          error: error.message === 'Invalid login credentials'
            ? '邮箱或密码错误'
            : '登录失败：' + error.message
        }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    if (!data?.user || !data?.session) {
      console.error('No user data returned')
      return new NextResponse(
        JSON.stringify({ error: '登录失败：未返回用户数据' }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('Login successful for user:', data.user.id)

    return new NextResponse(
      JSON.stringify({ 
        message: '登录成功',
        user: {
          id: data.user.id,
          email: data.user.email
        }
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new NextResponse(
      JSON.stringify({ 
        error: '登录失败：' + (error instanceof Error ? error.message : '服务器错误')
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
} 