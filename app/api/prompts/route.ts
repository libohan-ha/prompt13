import { supabase } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { original_prompt, optimized_prompt, model } = await req.json()
    const userId = req.headers.get('x-user-id')
    
    if (!original_prompt || !optimized_prompt || !model || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // 检查是否已存在相同的记录
    const { data: existingData } = await supabase
      .from('prompts')
      .select()
      .eq('original_prompt', original_prompt)
      .eq('user_id', userId)
      .single()

    if (existingData) {
      // 如果存在，更新记录
      const { error: updateError } = await supabase
        .from('prompts')
        .update({
          optimized_prompt,
          model,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingData.id)

      if (updateError) {
        console.error('Error updating record:', updateError)
        return NextResponse.json(
          { error: 'Failed to update record' },
          { status: 500 }
        )
      }

      return NextResponse.json({ message: 'Record updated successfully' })
    }

    // 如果不存在，创建新记录
    const { error: insertError } = await supabase
      .from('prompts')
      .insert([
        {
          original_prompt,
          optimized_prompt,
          model,
          user_id: userId
        }
      ])

    if (insertError) {
      console.error('Error inserting record:', insertError)
      return NextResponse.json(
        { error: 'Failed to save record' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Record saved successfully' })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    const userId = req.headers.get('x-user-id')

    if (!id || !userId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // 删除记录
    const { error } = await supabase
      .from('prompts')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) {
      console.error('Error deleting record:', error)
      return NextResponse.json(
        { error: 'Failed to delete record' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Record deleted successfully' })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    console.log('GET /api/prompts - User ID:', userId)

    if (!userId) {
      console.error('No user ID in request headers')
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 401 }
      )
    }

    const { data, error } = await supabase
      .from('prompts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch prompts' },
        { status: 500 }
      )
    }

    console.log('Successfully fetched prompts for user:', userId)
    return NextResponse.json(data)

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 