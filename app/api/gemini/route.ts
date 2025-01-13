import { supabase } from '@/lib/supabase'
import { HttpsProxyAgent } from 'https-proxy-agent'
import { NextRequest, NextResponse } from 'next/server'
import fetch, { RequestInit } from 'node-fetch'

const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY
// 代理配置
const PROXY_URL = process.env.HTTPS_PROXY || 'http://127.0.0.1:7890'
const proxyAgent = new HttpsProxyAgent(PROXY_URL)

export async function POST(req: NextRequest) {
  try {
    console.log('Checking environment variables:', {
      GEMINI_API_KEY: GEMINI_API_KEY ? '已配置' : '未配置',
      NODE_ENV: process.env.NODE_ENV,
      PROXY_URL
    })
    
    const { messages, model } = await req.json()
    
    if (!messages || !messages.length) {
      console.error('No messages provided')
      return NextResponse.json(
        { error: 'Messages are required' },
        { status: 400 }
      )
    }

    // 解析消息内容
    const messageContent = messages[messages.length - 1].content
    if (!messageContent) {
      console.error('No content in last message')
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      )
    }

    // 从消息内容中提取原始提示词
    let originalPrompt = messageContent
    if (messageContent.includes('Instructions:') && messageContent.includes('Input:')) {
      const parts = messageContent.split('\n\nInput:')
      originalPrompt = parts[1].trim()
    }

    const clientId = req.headers.get('x-client-id')
    if (!clientId) {
      console.error('No client ID provided')
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      )
    }

    if (!GEMINI_API_KEY) {
      console.error('Gemini API key not configured')
      return NextResponse.json(
        { error: 'API configuration error' },
        { status: 500 }
      )
    }
    
    console.log('Processing Gemini request:', {
      model,
      clientId,
      originalPrompt: originalPrompt.substring(0, 100) + '...' // Log truncated prompt
    })
    
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
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
          responseMimeType: "text/plain"
        }

    // 调用 Gemini API
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30秒超时
    
    const MAX_RETRIES = 3
    let retryCount = 0
    
    while (retryCount < MAX_RETRIES) {
      try {
        console.log(`Attempting Gemini API call (attempt ${retryCount + 1}/${MAX_RETRIES})`)
        
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_GEMINI_API_URL}/v1beta/models/${apiModel}:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              contents: [{
                role: "user",
                parts: [{ 
                  text: `你是一个专业的AI提示词优化专家。请帮我优化以下prompt，并按照以下格式返回：

# Role: [角色名称]

## Profile
- language: [语言]
- description: [详细的角色描述]
- background: [角色背景]
- personality: [性格特征]
- expertise: [专业领域]
- target_audience: [目标用户群]

## Skills

1. [核心技能类别 1]
   - [具体技能]: [简要说明]
   - [具体技能]: [简要说明]
   - [具体技能]: [简要说明]
   - [具体技能]: [简要说明]

2. [核心技能类别 2]
   - [具体技能]: [简要说明]
   - [具体技能]: [简要说明]
   - [具体技能]: [简要说明]
   - [具体技能]: [简要说明]

3. [辅助技能类别]
   - [具体技能]: [简要说明]
   - [具体技能]: [简要说明]
   - [具体技能]: [简要说明]
   - [具体技能]: [简要说明]

## Rules

1. [基本原则]：
   - [具体规则]: [详细说明]
   - [具体规则]: [详细说明]
   - [具体规则]: [详细说明]
   - [具体规则]: [详细说明]

2. [行为准则]：
   - [具体规则]: [详细说明]
   - [具体规则]: [详细说明]
   - [具体规则]: [详细说明]
   - [具体规则]: [详细说明]

3. [限制条件]：
   - [具体限制]: [详细说明]
   - [具体限制]: [详细说明]
   - [具体限制]: [详细说明]
   - [具体限制]: [详细说明]

## Workflows

1. [主要工作流程 1]
   - 目标: [明确目标]
   - 步骤 1: [详细说明]
   - 步骤 2: [详细说明]
   - 步骤 3: [详细说明]
   - 预期结果: [说明]

2. [主要工作流程 2]
   - 目标: [明确目标]
   - 步骤 1: [详细说明]
   - 步骤 2: [详细说明]
   - 步骤 3: [详细说明]
   - 预期结果: [说明]

请基于以上模板，优化并扩展以下prompt，确保内容专业、完整且结构清晰：

${originalPrompt}`
                }]
              }],
              generationConfig
            }),
            signal: controller.signal,
            agent: proxyAgent
          } as RequestInit
        )

        clearTimeout(timeoutId)

        if (!response.ok) {
          const error = await response.json()
          console.error('Gemini API error:', error)
          
          // 如果是超时或网络错误，继续重试
          if (response.status === 408 || response.status === 500 || response.status === 503) {
            retryCount++
            if (retryCount < MAX_RETRIES) {
              console.log(`Retrying... (${retryCount}/${MAX_RETRIES})`)
              await new Promise(resolve => setTimeout(resolve, 1000 * retryCount)) // 指数退避
              continue
            }
          }
          
          return NextResponse.json(
            { error: error.error?.message || 'Gemini API request failed' },
            { status: response.status }
          )
        }

        // 如果成功，处理响应
        const result = await response.json()
        const content = result.candidates?.[0]?.content?.parts?.[0]?.text
        
        if (!content) {
          console.error('No content in Gemini response:', result)
          return NextResponse.json(
            { error: 'Invalid response from Gemini API' },
            { status: 500 }
          )
        }

        // 保存到数据库
        console.log('Saving to database:', {
          original_prompt: originalPrompt.substring(0, 100) + '...',
          optimized_prompt: content.substring(0, 100) + '...',
          model,
          client_id: clientId
        })

        // 检查是否已存在相同的记录
        const { data: existingData } = await supabase
          .from('prompts')
          .select()
          .eq('original_prompt', originalPrompt)
          .eq('client_id', clientId)
          .single()

        if (existingData) {
          // 如果存在，更新记录
          const { error: updateError } = await supabase
            .from('prompts')
            .update({
              optimized_prompt: content,
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

          console.log('Successfully updated record')
        } else {
          // 如果不存在，创建新记录
          const { error: insertError } = await supabase
            .from('prompts')
            .insert([
              {
                original_prompt: originalPrompt,
                optimized_prompt: content,
                model,
                client_id: clientId
              }
            ])

          if (insertError) {
            console.error('Error inserting record:', insertError)
            return NextResponse.json(
              { error: 'Failed to save record' },
              { status: 500 }
            )
          }

          console.log('Successfully created new record')
        }

        return NextResponse.json(result)

      } catch (error) {
        console.error(`API Error (attempt ${retryCount + 1}/${MAX_RETRIES}):`, error)
        
        // 如果是超时错误，继续重试
        if (error instanceof Error && 
            (error.name === 'AbortError' || 
             error.message.includes('timeout') || 
             error.message.includes('failed'))) {
          retryCount++
          if (retryCount < MAX_RETRIES) {
            console.log(`Retrying... (${retryCount}/${MAX_RETRIES})`)
            await new Promise(resolve => setTimeout(resolve, 1000 * retryCount)) // 指数退避
            continue
          }
        }
        
        return NextResponse.json(
          { error: error instanceof Error ? error.message : 'Internal server error' },
          { status: 500 }
        )
      }
    }
    
    return NextResponse.json(
      { error: 'Maximum retries exceeded' },
      { status: 500 }
    )
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
