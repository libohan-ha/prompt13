"use client"

import {
    Dialog,
    DialogContent,
} from "@/components/ui/dialog"

interface LoadingDialogProps {
  open: boolean
}

export function LoadingDialog({ open }: LoadingDialogProps) {
  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-[425px] bg-white/80 backdrop-blur-xl border-0 shadow-2xl">
        <div className="flex flex-col items-center justify-center gap-6 py-10">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-8 border-blue-100"></div>
            <div className="absolute inset-0 rounded-full border-8 border-blue-500 border-t-transparent animate-spin"></div>
          </div>
          <div className="relative">
            <p className="text-xl font-medium bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent animate-pulse">
              正在优化中...
            </p>
            <div className="absolute inset-0 blur-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20"></div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
