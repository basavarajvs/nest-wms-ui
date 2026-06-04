import { useEffect, useRef, useCallback } from 'react'
import JsBarcode from 'jsbarcode'
import { Download, Printer, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface LpnBarcodeDialogProps {
  lpnNumber: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

function svgToCanvas(svg: SVGSVGElement, lpnNumber: string): HTMLCanvasElement | null {
  const svgData = new XMLSerializer().serializeToString(svg)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  const img = new Image()
  let resultCanvas: HTMLCanvasElement | null = null

  img.onload = () => {
    canvas.width = img.width
    canvas.height = img.height + 40
    if (ctx) {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0)
      ctx.font = '16px monospace'
      ctx.fillStyle = '#000000'
      ctx.textAlign = 'center'
      ctx.fillText(lpnNumber, canvas.width / 2, canvas.height - 10)
    }
    resultCanvas = canvas
  }
  img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
  return resultCanvas
}

export function LpnBarcodeDialog({ lpnNumber, open, onOpenChange }: LpnBarcodeDialogProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (open && svgRef.current && lpnNumber) {
      try {
        JsBarcode(svgRef.current, lpnNumber, {
          format: 'CODE128',
          width: 2,
          height: 80,
          displayValue: false,
          background: '#ffffff',
          lineColor: '#000000',
          margin: 15,
        })
      } catch {
        // barcode generation failed silently
      }
    }
  }, [open, lpnNumber])

  const handlePrint = useCallback(() => {
    if (!svgRef.current) return
    const canvas = svgToCanvas(svgRef.current, lpnNumber)
    setTimeout(() => {
      if (!canvas) return
      const printWindow = window.open('', '_blank')
      if (!printWindow) return
      printWindow.document.write(
        `<html><head><title>Print Barcode - ${lpnNumber}</title></head>`
      )
      printWindow.document.write('<body style="margin:0;text-align:center;padding-top:20px">')
      printWindow.document.write(`<img src="${canvas.toDataURL()}" />`)
      printWindow.document.write('</body></html>')
      printWindow.document.close()
      printWindow.focus()
      setTimeout(() => printWindow.print(), 250)
    }, 50)
  }, [lpnNumber])

  const handleDownload = useCallback(() => {
    if (!svgRef.current) return
    const canvas = svgToCanvas(svgRef.current, lpnNumber)
    setTimeout(() => {
      if (!canvas) return
      const link = document.createElement('a')
      link.download = `barcode-${lpnNumber}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    }, 50)
  }, [lpnNumber])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[420px]'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            Barcode — {lpnNumber}
          </DialogTitle>
          <DialogDescription>
            Code128 barcode for license plate number
          </DialogDescription>
        </DialogHeader>
        <div className='flex flex-col items-center gap-4 py-6'>
          <div className='rounded-lg border bg-white p-6'>
            <svg ref={svgRef} />
          </div>
          <p className='font-mono text-lg font-bold tracking-wider'>{lpnNumber}</p>
        </div>
        <DialogFooter className='gap-2 sm:gap-0'>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            <X className='mr-2 h-4 w-4' />
            Close
          </Button>
          <div className='flex gap-2'>
            <Button variant='outline' onClick={handleDownload}>
              <Download className='mr-2 h-4 w-4' />
              PNG
            </Button>
            <Button onClick={handlePrint}>
              <Printer className='mr-2 h-4 w-4' />
              Print
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
