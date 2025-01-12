"use client"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"
import { useEffect, useState } from "react"

interface IterateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (feedback: string) => Promise<void>
  isLoading: boolean
}

export function IterateDialog({
  open,
  onOpenChange,
  onConfirm,
  isLoading
}: IterateDialogProps) {
  const [feedback, setFeedback] = useState("")

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget as HTMLFormElement
    await onConfirm(feedback)
    setFeedback("")
  }

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) {
        setFeedback("")
      }
      onOpenChange(open)
    }}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>改进提示词</DialogTitle>
          <DialogDescription>
            请描述您希望如何改进当前的提示词。AI将根据您的要求进行优化。
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="例如：
- 希望角色更加专业，增加更多专业领域的技能
- 希望语气更加友好，增加更多互动性的工作流程
- 希望增加某个特定领域的规则和限制
- 希望调整目标用户群，使其更加精准..."
            className="h-[200px]"
            required
          />
          <div className="flex justify-end">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  处理中...
                </>
              ) : (
                '确认'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
