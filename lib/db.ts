import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL as string
const supabaseKey = process.env.SUPABASE_ANON_KEY as string

const supabase = createClient(supabaseUrl, supabaseKey)

// 插入优化记录
export async function insertOptimization(data: {
  originalPrompt: string
  optimizedPrompt?: string
  model: string
  version: number
}) {
  const { data: result, error } = await supabase
    .from('optimizations')
    .insert([{
      original_prompt: data.originalPrompt,
      optimized_prompt: data.optimizedPrompt,
      model: data.model,
      version: data.version
    }])
    .select()
    .single()

  if (error) throw error
  return result
}

// 获取优化记录
export async function getOptimizations(limit = 20, model?: string) {
  let query = supabase
    .from('optimizations')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (model) {
    query = query.eq('model', model)
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

// 更新优化记录
export async function updateOptimization(id: number, feedback: string) {
  const { error } = await supabase
    .from('optimizations')
    .update({ feedback })
    .eq('id', id)

  if (error) throw error
  return { success: true }
}

// 删除优化记录
export async function deleteOptimization(id: number) {
  const { error } = await supabase
    .from('optimizations')
    .delete()
    .eq('id', id)

  if (error) throw error
  return { success: true }
} 