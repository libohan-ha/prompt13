import { supabase } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { original_prompt, optimized_prompt, model } = await req.json()
    const userId = req.headers.get('x-user-id')
    
    console.log('POST /api/prompts - Received data:', {
      original_prompt: original_prompt?.slice(0, 50) + '...',
      model,
      userId
    })
    
    if (!original_prompt || !optimized_prompt || !model || !userId) {
      console.error('POST /api/prompts - Missing required fields:', {
        hasOriginalPrompt: !!original_prompt,
        hasOptimizedPrompt: !!optimized_prompt,
        hasModel: !!model,
        hasUserId: !!userId
      })
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // 检查是否已存在相同的记录
    const { data: existingData, error: findError } = await supabase
      .from('prompts')
      .select()
      .eq('original_prompt', original_prompt)
      .eq('user_id', userId)
      .single()

    console.log('POST /api/prompts - Check existing record result:', {
      findError,
      errorCode: findError?.code,
      errorMessage: findError?.message,
      hasExistingData: !!existingData
    })

    // PGRST116 means no record was found, which is expected when inserting new records
    if (findError && findError.code !== 'PGRST116') {
      console.error('POST /api/prompts - Database error:', {
        error: findError,
        code: findError.code,
        message: findError.message,
        details: findError.details
      })
      return NextResponse.json(
        { error: `Database error: ${findError.message}` },
        { status: 500 }
      )
    }

    if (existingData) {
      console.log('POST /api/prompts - Updating existing record:', {
        id: existingData.id,
        original_prompt,
        model
      })

      const { error: updateError } = await supabase
        .from('prompts')
        .update({
          optimized_prompt,
          model,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingData.id)

      if (updateError) {
        console.error('POST /api/prompts - Error updating record:', {
          error: updateError,
          code: updateError.code,
          message: updateError.message,
          details: updateError.details
        })
        return NextResponse.json(
          { error: `Failed to update record: ${updateError.message}` },
          { status: 500 }
        )
      }

      console.log('POST /api/prompts - Record updated successfully')
      return NextResponse.json({ message: 'Record updated successfully' })
    }

    // 如果记录不存在，创建新记录
    console.log('POST /api/prompts - Creating new record:', {
      original_prompt,
      model,
      userId
    })

    const { error: insertError } = await supabase
      .from('prompts')
      .insert([
        {
          original_prompt,
          optimized_prompt,
          model,
          user_id: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])

    if (insertError) {
      console.error('POST /api/prompts - Error inserting record:', {
        error: insertError,
        code: insertError.code,
        message: insertError.message,
        details: insertError.details
      })
      return NextResponse.json(
        { error: `Failed to insert record: ${insertError.message}` },
        { status: 500 }
      )
    }

    console.log('POST /api/prompts - Record created successfully')
    return NextResponse.json({ message: 'Record created successfully' })
  } catch (error) {
    console.error('POST /api/prompts - Unexpected error:', error)
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