"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { Settings } from "lucide-react"
import { useEffect, useState } from "react"

export function SettingsDialog() {
  const [open, setOpen] = useState(false)
  const [geminiKey, setGeminiKey] = useState("")

  // 在组件挂载后（客户端）读取 localStorage
  useEffect(() => {
    setGeminiKey(localStorage.getItem("gemini-key") || "")
  }, [])

  const handleSave = () => {
    localStorage.setItem("gemini-key", geminiKey)
    
    toast({
      title: "保存成功",
      description: "API Key 已更新"
    })
    
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-white border-purple-200 text-purple-600 hover:bg-purple-50 hover:border-purple-400">
          <Settings className="h-5 w-5 sm:h-6 sm:h-6" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>API设置</DialogTitle>
          <DialogDescription>
            设置 Gemini API Key
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="gemini-key">Gemini API Key</Label>
            <Input
              id="gemini-key"
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              placeholder="在此输入Gemini API Key"
            />
          </div>
        </div>
        <Button onClick={handleSave}>保存</Button>
      </DialogContent>
    </Dialog>
  )
} 