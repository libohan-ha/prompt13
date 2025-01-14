import { createClient } from '@/lib/supabase'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  console.log('Registration API called')
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

    console.log('Registration attempt for email:', email)
    
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

    // 使用 Supabase Auth 进行注册
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    })

    if (error) {
      console.error('Registration error:', error)
      return new NextResponse(
        JSON.stringify({ 
          error: error.message === 'User already registered'
            ? '该邮箱已被注册'
            : '注册失败：' + error.message
        }),
        { 
          status: error.message === 'User already registered' ? 409 : 500,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    if (!data?.user) {
      console.error('No user data returned')
      return new NextResponse(
        JSON.stringify({ error: '注册失败：未返回用户数据' }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('Registration successful for user:', data.user.id)

    return new NextResponse(
      JSON.stringify({ 
        message: '注册成功',
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
        error: '注册失败：' + (error instanceof Error ? error.message : '服务器错误')
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
} 