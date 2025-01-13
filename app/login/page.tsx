'use client'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setIsLoading(true)
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      })
      
      let data
      try {
        data = await response.json()
      } catch (parseError) {
        console.error('Error parsing response:', parseError)
        throw new Error('登录失败：服务器响应无效')
      }
      
      if (!response.ok) {
        throw new Error(data.error || '登录失败')
      }
      
      toast({
        title: "登录成功",
        description: "正在跳转..."
      })
      
      // 添加一个短暂的延迟，确保cookie已经设置
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // 使用window.location进行强制跳转到主页
      window.location.href = '/'
      
    } catch (error) {
      console.error('Login error:', error)
      toast({
        variant: "destructive",
        title: "登录失败",
        description: error instanceof Error ? error.message : "未知错误"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 space-y-6">
        <h1 className="text-3xl font-bold text-center text-gray-900">
          登录
        </h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              邮箱
            </label>
            <Input
              type="email"
              placeholder="请输入邮箱"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              密码
            </label>
            <Input
              type="password"
              placeholder="请输入密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <Button
            type="submit"
            className="w-full h-11"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                登录中...
              </>
            ) : (
              '登录'
            )}
          </Button>
        </form>
        
        <div className="text-center text-sm text-gray-500">
          还没有账号？
          <Button
            variant="link"
            className="text-blue-600 hover:text-blue-800"
            onClick={() => router.push('/register')}
          >
            立即注册
          </Button>
        </div>
      </div>
    </main>
  )
} 