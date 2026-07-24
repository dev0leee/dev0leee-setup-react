import { Loader2 } from 'lucide-react'

export const FullPageSpinner = () => {
  return (
    <div className="flex min-h-dvh items-center justify-center" role="status" aria-label="로딩 중">
      <Loader2 className="size-6 animate-spin text-muted-foreground" />
    </div>
  )
}
