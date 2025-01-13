import { supabase } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { original_prompt, optimized_prompt, model, client_id } = await req.json()
    
    if (!original_prompt || !optimized_prompt || !model || !client_id) {
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
      .eq('client_id', client_id)
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
          client_id
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
    const client_id = req.headers.get('x-client-id')

    if (!id || !client_id) {
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
      .eq('client_id', client_id)

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

export async function GET(req: NextRequest) {
  try {
    const clientId = req.headers.get('x-client-id')
    console.log('GET /api/prompts - Client ID:', clientId)
    
    if (!clientId) {
      console.error('GET /api/prompts - Missing client ID')
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      )
    }

    console.log('GET /api/prompts - Fetching records for client:', clientId)
    const { data, error } = await supabase
      .from('prompts')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('GET /api/prompts - Database error:', error)
      return NextResponse.json(
        { error: `Database error: ${error.message}` },
        { status: 500 }
      )
    }

    console.log('GET /api/prompts - Successfully fetched records:', data?.length)
    return NextResponse.json(data)
  } catch (error) {
    console.error('GET /api/prompts - Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 