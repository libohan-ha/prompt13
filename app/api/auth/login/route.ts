import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'
import { SignJWT } from 'jose'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key')

export async function POST(req: NextRequest) {
  console.log('Login API called')
  
  try {
    // 验证数据库连接
    console.log('Checking database connection...')
    const { data: healthCheck, error: healthError } = await supabase
      .from('users')
      .select('count')
      .limit(1)

    if (healthError) {
      console.error('Database connection error:', {
        error: healthError,
        message: healthError.message,
        details: healthError.details
      })
      return NextResponse.json(
        { error: '数据库连接失败: ' + healthError.message },
        { status: 503 }
      )
    }

    console.log('Database connection successful')

    // 解析请求数据
    let email, password
    try {
      const body = await req.json()
      email = body.email
      password = body.password
    } catch (parseError) {
      console.error('Request parsing error:', parseError)
      return NextResponse.json(
        { error: '无效的请求数据' },
        { status: 400 }
      )
    }

    console.log('Login attempt for email:', email)
    
    if (!email || !password) {
      console.log('Missing email or password')
      return NextResponse.json(
        { error: '邮箱和密码不能为空' },
        { status: 400 }
      )
    }

    // 查找用户
    const { data: user, error: findError } = await supabase
      .from('users')
      .select()
      .eq('email', email)
      .single()

    if (findError) {
      console.error('Error finding user:', findError)
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 401 }
      )
    }

    if (!user) {
      console.log('User not found:', email)
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 401 }
      )
    }

    // 验证密码
    const validPassword = await bcrypt.compare(password, user.password)
    if (!validPassword) {
      console.log('Invalid password for user:', email)
      return NextResponse.json(
        { error: '密码错误' },
        { status: 401 }
      )
    }

    // 生成 JWT token
    try {
      console.log('Generating JWT token...')
      const token = await new SignJWT({ userId: user.id })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('7d')
        .sign(secret)

      // 设置 cookie
      const cookieStore = cookies()
      cookieStore.set('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 // 7 days
      })

      console.log('Login successful for user:', user.id)
      return NextResponse.json({ 
        message: '登录成功',
        user: {
          id: user.id,
          email: user.email
        }
      })
    } catch (tokenError) {
      console.error('Token generation error:', tokenError)
      return NextResponse.json(
        { error: '登录失败：token生成错误' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Login error:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.json(
      { error: '登录失败：' + (error instanceof Error ? error.message : '服务器错误') },
      { status: 500 }
    )
  }
} 