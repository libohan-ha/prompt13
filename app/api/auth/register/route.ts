import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()
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

    if (findError && findError.code !== 'PGRST116') {
      console.error('Error checking existing user:', findError)
      return NextResponse.json(
        { error: '检查用户失败' },
        { status: 500 }
      )
    }

    if (existingUser) {
      console.log('Email already registered:', email)
      return NextResponse.json(
        { error: '该邮箱已被注册' },
        { status: 400 }
      )
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10)

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
        { error: '创建用户失败' },
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
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: '注册失败：服务器错误' },
      { status: 500 }
    )
  }
} 