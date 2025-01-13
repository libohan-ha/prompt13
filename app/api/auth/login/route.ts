import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'
import { SignJWT } from 'jose'
import { NextRequest, NextResponse } from 'next/server'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()
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

    if (findError || !user) {
      console.log('User not found:', findError)
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 401 }
      )
    }

    // 验证密码
    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      console.log('Invalid password')
      return NextResponse.json(
        { error: '密码错误' },
        { status: 401 }
      )
    }

    console.log('Login successful for user:', user.id)

    try {
      // 生成JWT token
      const secret = new TextEncoder().encode(JWT_SECRET)
      const token = await new SignJWT({ userId: user.id, email: user.email })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('7d')
        .sign(secret)

      console.log('JWT token generated successfully')

      // 创建响应
      const response = NextResponse.json({
        message: '登录成功',
        user: {
          id: user.id,
          email: user.email
        }
      })

      // 设置cookie
      response.cookies.set({
        name: 'token',
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 // 7 days
      })

      console.log('Cookie set successfully')
      return response

    } catch (tokenError) {
      console.error('Error generating token:', tokenError)
      return NextResponse.json(
        { error: '登录失败：无法生成令牌' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: '登录失败：服务器错误' },
      { status: 500 }
    )
  }
} 