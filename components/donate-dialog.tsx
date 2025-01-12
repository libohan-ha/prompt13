import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import Image from "next/image"

interface DonateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DonateDialog({ open, onOpenChange }: DonateDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-center">感谢您的支持</DialogTitle>
        </DialogHeader>
        <div className="flex justify-center p-4">
          <Image
            src="/donate-qr.jpg"
            alt="Donate QR Code"
            width={300}
            height={300}
            className="rounded-lg"
          />
        </div>
      </DialogContent>
    </Dialog>
  )
} 