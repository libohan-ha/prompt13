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

export interface Prompt {
  id: string
  original_prompt: string
  optimized_prompt: string
  model: string
  user_id: string | null
  created_at: string
}

export interface Version {
  id: string
  prompt_id: string
  content: string
  version_number: number
  feedback: string | null
  created_at: string
}

export interface PromptWithVersions extends Prompt {
  versions: Version[]
} 