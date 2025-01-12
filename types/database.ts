export interface Prompt {
  id: string
  original_prompt: string
  optimized_prompt: string
  model: string
  created_at: string
  user_id?: string
}

export interface Version {
  id: string
  prompt_id: string
  content: string
  version_number: number
  feedback?: string
  created_at: string
}

export interface Database {
  public: {
    Tables: {
      prompts: {
        Row: Prompt
        Insert: Omit<Prompt, 'id' | 'created_at'>
        Update: Partial<Omit<Prompt, 'id'>>
      }
      versions: {
        Row: Version
        Insert: Omit<Version, 'id' | 'created_at'>
        Update: Partial<Omit<Version, 'id'>>
      }
    }
  }
} 