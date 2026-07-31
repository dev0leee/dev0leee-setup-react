import { type MouseEvent, type TouchEvent, useEffect, useRef, useState } from 'react'

import {
  FIRE_INSPECTION_MESSAGE,
  SIGNATURE_CANVAS,
} from '@/features/fireInspection/constants/fireInspection'

/**
 * 입주민 확인 서명 (F2b). 레거시 `FireInspectionSignature.vue`.
 *
 * 🔴 **Vote의 공용 `CanvasSign`과 중복 구현이다.** 그쪽은 모달 안이고 이쪽은 화면 단계라
 * 껍데기가 완전히 다르다 — 등가 이관 원칙상 지금은 합치지 않았다 (`fire-inspection.md` F-Q13).
 *
 * ⚠️ **"이동이 있어야" 서명으로 인정된다** — 탭만 하면 `hasSignature`가 서지 않는다.
 * `draw`에서만 참이 되기 때문이다.
 *
 * ⚠️ **날짜에 zero-pad가 없다** (`2026년 7월 5일`). 공용 `formatObjectDate(_, 'korean')`은
 * pad를 하므로 그것을 쓰면 표시가 달라진다 — 문자열 조립을 그대로 옮겼다.
 *
 * 🔴 **동/호가 항상 비어 있다.** 레거시가 `dong`·`ho` prop을 선언해놓고 아무도 넘기지
 * 않아 주소 줄이 렌더되지 않는다 — 공식 서명 문서에 세대 식별이 없는 셈이다
 * (`fire-inspection.md` F-Q12). 등가 이관이라 prop 자체를 옮기지 않았다.
 *
 * ⚠️ **DPR 스케일이 핵심이다** — `canvas.width = rect.width * dpr` + `ctx.scale(dpr, dpr)`.
 * 빠뜨리면 선이 굵거나 흐려진다.
 */
export const FireInspectionSignature = ({
  onComplete,
}: {
  onComplete: (dataUrl: string | null) => void
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const contextRef = useRef<CanvasRenderingContext2D | null>(null)
  const isDrawingRef = useRef(false)

  const [hasSignature, setHasSignature] = useState(false)

  const today = new Date()
  const formattedDate = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const context = canvas.getContext('2d')
    if (!context) return

    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * window.devicePixelRatio
    canvas.height = rect.height * window.devicePixelRatio
    context.scale(window.devicePixelRatio, window.devicePixelRatio)
    context.strokeStyle = SIGNATURE_CANVAS.strokeStyle
    context.lineWidth = SIGNATURE_CANVAS.lineWidth
    context.lineCap = 'round'
    context.lineJoin = 'round'

    contextRef.current = context
  }, [])

  const getCoordinates = (event: MouseEvent<HTMLCanvasElement> | TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    const rect = canvas.getBoundingClientRect()

    if ('touches' in event) {
      const touch = event.touches[0]

      return { x: (touch?.clientX ?? 0) - rect.left, y: (touch?.clientY ?? 0) - rect.top }
    }

    return { x: event.clientX - rect.left, y: event.clientY - rect.top }
  }

  const startDrawing = (event: MouseEvent<HTMLCanvasElement> | TouchEvent<HTMLCanvasElement>) => {
    event.preventDefault()

    const context = contextRef.current
    if (!context) return

    isDrawingRef.current = true
    const { x, y } = getCoordinates(event)
    context.beginPath()
    context.moveTo(x, y)
  }

  const draw = (event: MouseEvent<HTMLCanvasElement> | TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return

    const context = contextRef.current
    if (!context) return

    event.preventDefault()
    const { x, y } = getCoordinates(event)
    context.lineTo(x, y)
    context.stroke()
    // 🔴 그리기(이동)에서만 선다 — 탭만으로는 서명으로 인정되지 않는다
    setHasSignature(true)
  }

  const stopDrawing = () => {
    if (!isDrawingRef.current) return

    const context = contextRef.current
    const canvas = canvasRef.current
    isDrawingRef.current = false
    context?.closePath()

    if (hasSignature && canvas) {
      onComplete(canvas.toDataURL('image/png'))
    }
  }

  const clearSignature = () => {
    const canvas = canvasRef.current
    const context = contextRef.current
    if (!canvas || !context) return

    // ⚠️ `ctx`가 이미 dpr로 스케일돼 있어 실제 지워지는 영역이 캔버스보다 넓다.
    // 결과는 정상이라 레거시 그대로 뒀다
    context.clearRect(0, 0, canvas.width, canvas.height)
    setHasSignature(false)
    onComplete(null)
  }

  return (
    <div className="flex flex-1 flex-col overflow-auto px-5 pt-16 pb-5">
      <div className="flex flex-col gap-2">
        <h2 className="pretendard-20Bold text-defaults-primary-text-primary">
          {FIRE_INSPECTION_MESSAGE.signatureTitle}
        </h2>
        <p className="pretendard-14Regular text-defaults-tertiary-text-tertiary">
          {FIRE_INSPECTION_MESSAGE.signatureGuideFirst}
          <br />
          {FIRE_INSPECTION_MESSAGE.signatureGuideSecond}
        </p>
      </div>

      <div className="mt-8 flex flex-col items-center gap-1">
        <span className="pretendard-14Regular text-defaults-tertiary-text-tertiary">
          {formattedDate}
        </span>
      </div>

      <div className="relative mt-6 h-[240px]">
        <canvas
          ref={canvasRef}
          className="h-full w-full rounded-xl border border-defaults-tertiary-border-tertiary bg-defaults-secondary-background-secondary"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />

        {!hasSignature && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="pretendard-14Regular text-defaults-tertiary-text-tertiary">
              {FIRE_INSPECTION_MESSAGE.signaturePlaceholder}
            </span>
          </div>
        )}
      </div>

      <div className="mt-4 flex justify-center">
        {hasSignature && (
          <button
            type="button"
            className="rounded-lg border border-defaults-tertiary-border-tertiary bg-base-b-white px-6 py-2 pretendard-14Medium text-defaults-primary-text-primary"
            onClick={clearSignature}
          >
            {FIRE_INSPECTION_MESSAGE.signatureReset}
          </button>
        )}
      </div>
    </div>
  )
}
