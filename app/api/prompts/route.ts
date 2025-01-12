import { supabase } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { original_prompt, optimized_prompt, model } = body

    // 插入新的prompt记录
    const { data: prompt, error: promptError } = await supabase
      .from('prompts')
      .insert([
        {
          original_prompt,
          optimized_prompt,
          model
        }
      ])
      .select()
      .single()

    if (promptError) throw promptError

    // 创建第一个版本记录
    const { error: versionError } = await supabase
      .from('versions')
      .insert([
        {
          prompt_id: prompt.id,
          content: optimized_prompt,
          version_number: 1
        }
      ])

    if (versionError) throw versionError

    return NextResponse.json(prompt)
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('prompts')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 