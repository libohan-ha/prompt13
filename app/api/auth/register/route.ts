import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  console.log('Registration API called')
  console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
  console.log('Has Supabase Key:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

  try {
    // 验证数据库连接
    console.log('Checking database connection...')
    const { data: healthCheck, error: healthError } = await supabase
      .from('users')
      .select('count')
      .limit(1)
      .throwOnError() // 这会确保在出错时抛出异常

    console.log('Database connection successful')

    // 解析请求数据
    let email, password
    try {
      const body = await req.json()
      email = body.email
      password = body.password
      console.log('Request data parsed successfully')
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
    console.log('Checking if email exists:', email)
    const { data: existingUser, error: findError } = await supabase
      .from('users')
      .select()
      .eq('email', email)
      .maybeSingle()
      .throwOnError() // 这会确保在出错时抛出异常

    if (existingUser) {
      console.log('Email already registered:', email)
      return NextResponse.json(
        { error: '该邮箱已被注册' },
        { status: 400 }
      )
    }

    // 加密密码
    console.log('Hashing password...')
    const hashedPassword = await bcrypt.hash(password, 10)
    console.log('Password hashed successfully')

    // 创建新用户
    console.log('Creating new user...')
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
      .throwOnError() // 这会确保在出错时抛出异常

    if (!newUser) {
      console.error('No user data returned after creation')
      throw new Error('创建用户失败：未返回用户数据')
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
    // 处理 Supabase 错误
    if (error && typeof error === 'object' && 'code' in error) {
      console.error('Supabase error:', {
        code: error.code,
        message: error.message,
        details: error.details
      })
      return NextResponse.json(
        { error: `数据库操作失败: ${error.message}` },
        { status: 500 }
      )
    }

    // 处理其他错误
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