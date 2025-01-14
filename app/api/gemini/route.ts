import { GEMINI_API_KEY } from '@/lib/api'
import { HttpsProxyAgent } from 'https-proxy-agent'
import { NextRequest, NextResponse } from 'next/server'
import fetch from 'node-fetch'

// 代理配置 - 根据环境变量决定是否使用代理
const USE_PROXY = process.env.USE_PROXY === 'true'
const PROXY_URL = process.env.HTTPS_PROXY || 'http://127.0.0.1:7890'
const proxyAgent = USE_PROXY ? new HttpsProxyAgent(PROXY_URL) : undefined

const PROMPT_TEMPLATE = `你是一个专业的AI提示词优化专家。请帮我优化以下prompt，并按照以下格式返回：

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

请基于以上模板，优化并扩展以下prompt，确保内容专业、完整且结构清晰：`

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    
    if (!userId) {
      console.error('No user ID in request headers')
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 401 }
      )
    }

    if (!GEMINI_API_KEY) {
      console.error('Gemini API key not configured')
      return NextResponse.json(
        { error: 'API configuration error' },
        { status: 500 }
      )
    }

    const { messages, model } = await request.json()
    
    console.log('POST /api/gemini - Request:', {
      model,
      userId,
      messageCount: messages?.length,
      apiKey: GEMINI_API_KEY ? '已配置' : '未配置'
    })

    if (!messages || !model) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Extract the original prompt from messages
    const originalPrompt = messages[messages.length - 1].content
    
    // Prepare the message with template
    const prompt = `${PROMPT_TEMPLATE}\n\n${originalPrompt}`

    // Call Gemini API with optional proxy
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            role: "user",
            parts: [{ text: prompt }]
          }],
          generationConfig: model === "gemini-2.0-flash-exp" || model === "gemini-exp-1206" ? {
            temperature: 0.9,
            maxOutputTokens: 2048,
          } : {
            temperature: 1,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8192,
            responseMimeType: "text/plain"
          }
        }),
        ...(USE_PROXY ? { agent: proxyAgent } : {})
      }
    )

    if (!response.ok) {
      const errorData = await response.json()
      console.error('Gemini API error:', errorData)
      return NextResponse.json(
        { error: errorData.error?.message || 'Failed to generate content' },
        { status: response.status }
      )
    }

    const result = await response.json()
    console.log('Gemini API response:', {
      hasContent: !!result.candidates?.[0]?.content,
      contentLength: result.candidates?.[0]?.content?.parts?.[0]?.text?.length
    })
    
    return NextResponse.json(result)

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
