import { get, set } from '@vercel/edge-config'

export async function insertOptimization(data: {
  originalPrompt: string
  model: string
  version: number
  createdAt: Date
}) {
  // 获取现有记录
  const optimizations = await get('optimizations') || []
  
  // 添加新记录到开头
  optimizations.unshift({
    ...data,
    id: Date.now()
  })
  
  // 只保留最近的20条记录
  if (optimizations.length > 20) {
    optimizations.pop()
  }
  
  // 更新Edge配置
  await set('optimizations', optimizations)
  
  return { success: true }
}

export async function getOptimizations() {
  return await get('optimizations') || []
} 