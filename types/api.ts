export type GeminiResponse = {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string
      }>
    }
  }>
}

export type DeepseekResponse = {
  choices: Array<{
    message: {
      content: string
    }
  }>
} 