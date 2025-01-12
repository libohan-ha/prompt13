export const GEMINI_API_KEY = 'AIzaSyAfjO3q_JrrAZ_hCTbjGut4SM_pTohPgjg'

export async function callDeepseek(systemPrompt: string, userPrompt: string) {
  const apiKey = "sk-7e369c68994443ab8c169d8d3612ee8e"

  try {
    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user", 
            content: userPrompt
          }
        ],
        stream: false,
        temperature: 0.7,
        max_tokens: 2000
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || "API调用失败")
    }

    const data = await response.json()
    if (!data.choices?.[0]?.message?.content) {
      throw new Error("API返回格式错误")
    }
    return data.choices[0].message.content
  } catch (error) {
    console.error("DeepSeek API Error:", error)
    throw error
  }
}

export async function callGemini(systemPrompt: string, userPrompt: string) {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-exp-1206:generateContent?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [
            { text: `Instructions: ${systemPrompt}\n\nInput: ${userPrompt}` }
          ]
        }
      ],
      generationConfig: {
        temperature: 1,
        topK: 64,
        topP: 0.95,
        maxOutputTokens: 8192,
        responseMimeType: "text/plain"
      }
    })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message || "API调用失败")
  }

  const data = await response.json()
  if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
    throw new Error("API返回格式错误")
  }
  return data.candidates[0].content.parts[0].text
}

export async function callGeminiFlash(systemPrompt: string, userPrompt: string) {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `${systemPrompt}\n\n请处理以下内容：\n${userPrompt}`
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.9,
        maxOutputTokens: 2048,
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_NONE"
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_NONE"
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_NONE"
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_NONE"
        }
      ]
    })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message || "API调用失败")
  }

  const data = await response.json()
  if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
    throw new Error("API返回格式错误")
  }
  return data.candidates[0].content.parts[0].text
} 