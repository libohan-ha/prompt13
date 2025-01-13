"use client"

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "@/components/ui/use-toast"
import { getClientId, setLocalStorage } from "@/lib/utils"
import { Search, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

type HistoryRecord = {
  id: string
  original_prompt: string
  optimized_prompt: string
  model: string
  created_at: string
}

interface HistoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function HistoryDialog({ open, onOpenChange }: HistoryDialogProps) {
  const router = useRouter()
  const [records, setRecords] = useState<HistoryRecord[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      loadHistory()
    }
  }, [open])

  const loadHistory = async () => {
    try {
      const clientId = getClientId()
      const response = await fetch('/api/prompts', {
        headers: {
          'x-client-id': clientId || ''
        }
      })
      if (!response.ok) throw new Error('Failed to load history')
      const data = await response.json()
      
      // 使用Map进行去重，以ID为键
      const uniqueRecords = new Map()
      data.forEach((record: HistoryRecord) => {
        if (!uniqueRecords.has(record.id)) {
          uniqueRecords.set(record.id, record)
        }
      })
      
      // 转换回数组并按创建时间排序
      const deduplicatedRecords = Array.from(uniqueRecords.values())
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      
      setRecords(deduplicatedRecords)
    } catch (error) {
      console.error('Error loading history:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelect = (record: HistoryRecord) => {
    setLocalStorage('optimizedPrompt', JSON.stringify({
      originalPrompt: record.original_prompt,
      optimizedPrompt: record.optimized_prompt,
      model: record.model
    }))
    onOpenChange(false)
    router.push('/optimize')
  }

  const handleDelete = async (id: string) => {
    try {
      setIsDeleting(true)
      const clientId = getClientId()
      const response = await fetch(`/api/prompts?id=${id}`, {
        method: 'DELETE',
        headers: {
          'x-client-id': clientId || ''
        }
      })

      if (!response.ok) {
        throw new Error('Failed to delete record')
      }

      toast({
        title: "删除成功",
        description: "记录已被删除"
      })

      // 重新加载记录
      loadHistory()
    } catch (error) {
      console.error('Delete error:', error)
      toast({
        variant: "destructive",
        title: "删除失败",
        description: "无法删除记录"
      })
    } finally {
      setIsDeleting(false)
      setDeleteId(null)
    }
  }

  const filteredRecords = records.filter(record => 
    record.original_prompt.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>历史记录</DialogTitle>
          </DialogHeader>
          
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              className="pl-10"
              placeholder="搜索历史记录..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <ScrollArea className="h-[400px] pr-4">
            {isLoading ? (
              <div className="text-center py-4">加载中...</div>
            ) : filteredRecords.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                {searchTerm ? "没有找到匹配的记录" : "暂无历史记录"}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredRecords.map((record) => (
                  <div
                    key={record.id}
                    className="p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-400 transition-all relative group"
                  >
                    <div 
                      className="cursor-pointer"
                      onClick={() => handleSelect(record)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-medium truncate flex-1">
                          {record.original_prompt}
                        </div>
                        <div className="text-sm text-gray-500 ml-2">
                          {new Date(record.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        模型: {record.model}
                      </div>
                    </div>
                    <button
                      className="absolute right-2 top-2 p-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation()
                        setDeleteId(record.id)
                      }}
                      disabled={isDeleting}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              这将永久删除该记录。此操作无法撤消。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDelete(deleteId)}
              className="bg-red-500 hover:bg-red-600"
            >
              {isDeleting ? "删除中..." : "删除"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
} 