import { GEMINI_API_KEY } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { messages, model } = await req.json()
    const originalPrompt = messages[messages.length - 1].content
    
    // 根据模型名称确定实际的 API 模型名称
    const apiModel = model === "gemini-1206" ? "gemini-exp-1206" : "gemini-2.0-flash-exp"
    
    // 根据模型确定配置
    const generationConfig = model === "gemini-2.0-flash-exp" 
      ? {
          temperature: 0.9,
          maxOutputTokens: 2048,
        }
      : {
          temperature: 1,
          topK: 64,
          topP: 0.95,
          maxOutputTokens: 8192,
        }

    // 调用 Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${apiModel}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [{
            role: "user",
            parts: [{ text: originalPrompt }]
          }],
          generationConfig
        })
      }
    )

    if (!response.ok) {
      throw new Error('Gemini API request failed')
    }

    const result = await response.json()
    const content = result.candidates?.[0]?.content?.parts?.[0]?.text

    if (content) {
      // 保存到数据库
      const { error: dbError } = await supabase
        .from('prompts')
        .insert([
          {
            original_prompt: originalPrompt,
            optimized_prompt: content,
            model: model // 保存原始的模型名称
          }
        ])

      if (dbError) {
        console.error('Database Error:', dbError)
      }
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
