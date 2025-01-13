"use client"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "@/components/ui/use-toast"
import { getClientId } from "@/lib/utils"
import { Loader2, Search, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"

interface HistoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (prompt: any) => void
}

export function HistoryDialog({
  open,
  onOpenChange,
  onSelect
}: HistoryDialogProps) {
  const [prompts, setPrompts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      loadPrompts()
    } else {
      setSearchTerm("")
    }
  }, [open])

  const loadPrompts = async () => {
    try {
      setLoading(true)
      console.log('Loading prompts...')
      
      const response = await fetch('/api/prompts', {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      console.log('API Response status:', response.status)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('API Error:', errorData)
        throw new Error(
          errorData.error || 
          'Failed to fetch prompts'
        )
      }
      
      const data = await response.json()
      console.log('Loaded prompts:', data)
      setPrompts(data)
    } catch (error) {
      console.error('Error loading prompts:', error)
      toast({
        variant: "destructive",
        title: "加载失败",
        description: error instanceof Error 
          ? `错误: ${error.message}` 
          : "未知错误，请检查网络连接"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      setDeleting(id)
      const response = await fetch(`/api/prompts?id=${id}`, {
        method: 'DELETE',
        headers: {
          'x-client-id': getClientId() || ''
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete prompt')
      }
      
      await loadPrompts()
      
      toast({
        title: "删除成功",
        description: "已删除该记录"
      })
    } catch (error) {
      console.error('Error deleting prompt:', error)
      toast({
        variant: "destructive",
        title: "删除失败",
        description: error instanceof Error ? error.message : "未知错误"
      })
    } finally {
      setDeleting(null)
    }
  }

  const handleSelectPrompt = (prompt: any) => {
    console.log('handleSelectPrompt called with:', prompt)
    if (!prompt) {
      console.error('No prompt data received')
      return
    }
    
    if (typeof onSelect !== 'function') {
      console.error('onSelect is not a function:', onSelect)
      return
    }
    
    try {
      onSelect(prompt)
    } catch (error) {
      console.error('Error in onSelect:', error)
    }
  }

  const filteredPrompts = prompts.filter(prompt => 
    prompt.original_prompt.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>历史记录</DialogTitle>
        </DialogHeader>
        
        <div className="relative mb-4">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
          <Input
            placeholder="搜索历史记录..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <ScrollArea className="flex-1">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            </div>
          ) : filteredPrompts.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              暂无历史记录
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPrompts.map((prompt) => (
                <div
                  key={prompt.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    console.log('Item clicked, prompt:', prompt)
                    handleSelectPrompt(prompt)
                  }}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-sm text-gray-500">
                      {new Date(prompt.created_at).toLocaleString()}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(prompt.id)
                        }}
                        disabled={deleting === prompt.id}
                      >
                        {deleting === prompt.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4 text-red-500" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="text-sm text-gray-700 mb-2 whitespace-pre-wrap line-clamp-3">
                    {prompt.original_prompt}
                  </div>
                  <div className="text-xs text-gray-500">
                    模型：{prompt.model}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
} 