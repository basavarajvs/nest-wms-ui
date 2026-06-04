import { useState } from 'react'
import { InspectionList } from './components/InspectionList'
import { QcInspectionDetailDialog } from './components/QcInspectionDetailDialog'
import type { QualityInspection } from './data/quality-queries'

export function QualityInspections() {
  const [detailInspectionId, setDetailInspectionId] = useState<string | null>(null)

  const handleViewDetail = (inspection: QualityInspection) => {
    setDetailInspectionId(inspection.id)
  }

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-2xl font-bold tracking-tight'>Quality</h1>
        <p className='text-muted-foreground'>
          Inspect and manage quality control results for inbound shipments
        </p>
      </div>
      <InspectionList onViewDetail={handleViewDetail} />

      {detailInspectionId && (
        <QcInspectionDetailDialog
          inspectionId={detailInspectionId}
          open={!!detailInspectionId}
          onOpenChange={(open) => { if (!open) setDetailInspectionId(null) }}
        />
      )}
    </div>
  )
}
