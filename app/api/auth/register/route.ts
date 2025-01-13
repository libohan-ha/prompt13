import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  console.log('Starting registration process')
  console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
  console.log('Has Supabase Key:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

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

    console.log('Registration attempt for email:', email)
    
    if (!email || !password) {
      console.log('Missing email or password')
      return NextResponse.json(
        { error: '邮箱和密码不能为空' },
        { status: 400 }
      )
    }

    // 检查邮箱是否已被注册
    const { data: existingUser, error: findError } = await supabase
      .from('users')
      .select()
      .eq('email', email)
      .single()

    if (findError) {
      if (findError.code === 'PGRST116') {
        // 这是正常的，表示用户不存在
        console.log('User not found, proceeding with registration')
      } else {
        console.error('Error checking existing user:', findError)
        return NextResponse.json(
          { error: '验证邮箱失败：' + findError.message },
          { status: 500 }
        )
      }
    }

    if (existingUser) {
      console.log('Email already registered:', email)
      return NextResponse.json(
        { error: '该邮箱已被注册' },
        { status: 400 }
      )
    }

    // 加密密码
    let hashedPassword
    try {
      hashedPassword = await bcrypt.hash(password, 10)
    } catch (hashError) {
      console.error('Password hashing error:', hashError)
      return NextResponse.json(
        { error: '密码处理失败' },
        { status: 500 }
      )
    }

    // 创建新用户
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert([
        {
          email,
          password: hashedPassword
        }
      ])
      .select()
      .single()

    if (createError) {
      console.error('Error creating user:', createError)
      return NextResponse.json(
        { error: '创建用户失败：' + createError.message },
        { status: 500 }
      )
    }

    if (!newUser) {
      console.error('No user data returned after creation')
      return NextResponse.json(
        { error: '创建用户失败：未返回用户数据' },
        { status: 500 }
      )
    }

    console.log('User registered successfully:', newUser.id)
    return NextResponse.json({
      message: '注册成功',
      user: {
        id: newUser.id,
        email: newUser.email
      }
    })

  } catch (error) {
    console.error('Registration error:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.json(
      { error: '注册失败：' + (error instanceof Error ? error.message : '服务器错误') },
      { status: 500 }
    )
  }
} 