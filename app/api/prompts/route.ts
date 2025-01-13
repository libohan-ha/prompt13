import { supabase, testConnection } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'
import type { Prompt, Version } from '@/types/api'
import { getClientId } from '@/lib/utils'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const clientId = body.client_id || req.headers.get('x-client-id')
    
    console.log('Received request:', { 
      body,
      clientId,
      headers: Object.fromEntries(req.headers.entries())
    })

    if (!clientId) {
      return NextResponse.json(
        { error: 'Missing client ID' },
        { status: 400 }
      )
    }

    // 测试数据库连接
    const isConnected = await testConnection()
    if (!isConnected) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      )
    }

    const { original_prompt, optimized_prompt, model } = body

    // 插入prompt记录
    console.log('Inserting into database:', {
      original_prompt,
      optimized_prompt,
      model,
      client_id: clientId
    })

    const { data: prompt, error: promptError } = await supabase
      .from('prompts')
      .insert({
        original_prompt,
        optimized_prompt,
        model,
        client_id: clientId
      })
      .select()
      .single()

    if (promptError) {
      console.error('Database error:', promptError)
      return NextResponse.json(
        { 
          error: 'Failed to save prompt',
          details: promptError,
          message: promptError.message,
          code: promptError.code
        },
        { status: 500 }
      )
    }

    console.log('Successfully inserted prompt:', prompt)
    return NextResponse.json(prompt)
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error,
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const clientId = req.headers.get('x-client-id')
    
    console.log('Fetching prompts from database...')
    
    const { data, error } = await supabase
      .from('prompts')
      .select(`
        *,
        versions (
          id,
          content,
          version_number,
          feedback,
          created_at
        )
      `)
      .eq('client_id', clientId) // 只查询当前客户端的记录
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch prompts', details: error },
        { status: 500 }
      )
    }

    console.log('Successfully fetched prompts:', data)
    return NextResponse.json(data)
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    const clientId = req.headers.get('x-client-id')

    if (!id) {
      return NextResponse.json(
        { error: 'Missing prompt ID' },
        { status: 400 }
      )
    }

    console.log('Deleting prompt:', { id, clientId })

    const { error } = await supabase
      .from('prompts')
      .delete()
      .match({ id, client_id: clientId })

    if (error) {
      console.error('Delete error:', error)
      return NextResponse.json(
        { error: 'Failed to delete prompt', details: error },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error },
      { status: 500 }
    )
  }
} 