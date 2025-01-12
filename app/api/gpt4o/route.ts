import { supabase } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

// 添加返回类型注解并确保总是返回Response
async function fetchWithRetry(url: string, options: RequestInit, retries = 3): Promise<Response> {
  let lastError: Error | undefined

  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(30000), // 30 秒超时
      })
      return response
    } catch (error) {
      lastError = error as Error
      if (i === retries - 1) break
      // 等待一段时间后重试
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
    }
  }

  throw lastError || new Error('All retry attempts failed')
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const originalMessages = body.messages
    
    // 获取原始prompt（从system和user消息中）
    const originalPrompt = originalMessages
      .filter((msg: any) => ['system', 'user'].includes(msg.role))
      .map((msg: any) => msg.content)
      .join('\n\n')

    const response = await fetchWithRetry("https://api.302.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GPT4O_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: body.messages,
        stream: true
      })
    })

    if (!response.ok) {
      const error = await response.json()
      return NextResponse.json(
        { error: error.error?.message || 'API request failed' },
        { status: response.status }
      )
    }

    const encoder = new TextEncoder()
    const decoder = new TextDecoder()

    let fullContent = ''

    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader()
        
        try {
          while (reader) {
            const { done, value } = await reader.read()
            if (done) break
            
            const chunk = decoder.decode(value, { stream: true })
            controller.enqueue(encoder.encode(chunk))

            // 从chunk中提取内容
            const lines = chunk.split('\n')
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6)
                if (data === '[DONE]') continue
                try {
                  const parsed = JSON.parse(data)
                  const content = parsed.choices[0]?.delta?.content || ''
                  fullContent += content
                } catch (e) {
                  console.error('Error parsing chunk:', e)
                }
              }
            }
          }

          // 保存到数据库
          if (fullContent) {
            const { error: dbError } = await supabase
              .from('prompts')
              .insert([
                {
                  original_prompt: originalPrompt,
                  optimized_prompt: fullContent,
                  model: 'gpt-4o'
                }
              ])

            if (dbError) {
              console.error('Database Error:', dbError)
            }
          }

        } catch (error) {
          controller.enqueue(encoder.encode('data: {"error": true}\n\n'))
          controller.error(error)
        } finally {
          controller.close()
          reader?.releaseLock()
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })

  } catch (error) {
    console.error('API Route Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 