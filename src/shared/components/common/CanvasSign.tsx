import { useEffect, useRef, useState } from 'react'

import { SpinnerCircle } from '@/shared/components/common/SpinnerCircle'
import type { CanvasSignProps } from '@/shared/types/canvasSign'
import { base64ToFile } from '@/shared/utils/base64ToFile'

/**
 * 터치 서명 패드. 레거시 `CanvasSign.vue`(107 LOC).
 *
 * ⚠️ **터치 이벤트만 받는다.** 레거시가 `touchstart`/`touchmove`/`touchend`만
 * 달았고 `event.targetTouches[0]`을 읽는다. 웹뷰 전용 화면이라 마우스로는
 * 그릴 수 없다 — 데스크톱 브라우저에서 테스트가 안 되는 이유다.
 * 포인터 이벤트로 넓히면 동작이 달라지므로 그대로 뒀다 (`deferred.md`).
 *
 * ⚠️ 캔버스 내부 해상도는 **400×200 고정**이고 표시 높이는 `h-[132px]`다.
 * 폭이 화면에 맞춰 늘어나므로 좌표가 실제로는 어긋난다 — `getBoundingClientRect()`로
 * 화면 좌표를 구하지만 캔버스 좌표계로 환산하지 않기 때문이다.
 * 레거시 그대로 옮겼다 (`deferred.md`).
 */
export const CanvasSign = ({ isPending, onSave }: CanvasSignProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const contextRef = useRef<CanvasRenderingContext2D | null>(null)
  const isDrawingRef = useRef(false)
  const [signatureImageUrl, setSignatureImageUrl] = useState<string | null>(null)

  useEffect(() => {
    const context = canvasRef.current?.getContext('2d')
    if (!context) return

    context.strokeStyle = '#000'
    context.lineWidth = 2
    context.lineCap = 'round'
    contextRef.current = context
  }, [])

  const isDisabled = signatureImageUrl === null || isPending

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-full">
        <canvas
          ref={canvasRef}
          width={400}
          height={200}
          className="flex h-[132px] w-full cursor-crosshair items-center justify-center rounded-lg border border-defaults-tertiary-border-tertiary bg-[#FAFAFA]"
          onTouchStart={() => {
            isDrawingRef.current = true
            contextRef.current?.beginPath()
          }}
          onTouchMove={(event) => {
            if (!isDrawingRef.current) return

            const touch = event.targetTouches[0]
            const canvas = canvasRef.current
            if (!touch || !canvas || !contextRef.current) return

            const rect = canvas.getBoundingClientRect()
            contextRef.current.lineTo(touch.clientX - rect.left, touch.clientY - rect.top)
            contextRef.current.stroke()
          }}
          onTouchEnd={() => {
            isDrawingRef.current = false
            contextRef.current?.closePath()
            setSignatureImageUrl(canvasRef.current?.toDataURL() ?? null)
          }}
        />
        <span className="absolute top-1/2 left-1/2 -translate-x-1/2 pretendard-13Regular text-defaults-tertiary-text-tertiary">
          서명
        </span>
      </div>
      <div className="flex w-full gap-2">
        <button
          type="button"
          className="w-1/3 overflow-hidden rounded-lg bg-defaults-primary-background-primary-inverse px-2 py-3 pretendard-16SemiBold whitespace-nowrap text-base-b-white disabled:bg-[#EEF2F6] disabled:text-defaults-secondary-text-secondary"
          disabled={isDisabled}
          onClick={() => {
            const canvas = canvasRef.current
            if (!canvas || !contextRef.current) return

            contextRef.current.clearRect(0, 0, canvas.width, canvas.height)
            setSignatureImageUrl(null)
          }}
        >
          초기화
        </button>
        <button
          type="button"
          className="flex w-2/3 items-center justify-center rounded-lg bg-brand-default-background-brand px-2 py-3 pretendard-16SemiBold whitespace-nowrap text-base-b-white disabled:bg-[#EEF2F6] disabled:text-defaults-secondary-text-secondary"
          disabled={isDisabled}
          onClick={() => {
            if (!signatureImageUrl) return
            onSave({
              file: base64ToFile({ base64String: signatureImageUrl, fileName: 'signature.png' }),
            })
          }}
        >
          {isPending ? <SpinnerCircle /> : '서명 완료'}
        </button>
      </div>
    </div>
  )
}
