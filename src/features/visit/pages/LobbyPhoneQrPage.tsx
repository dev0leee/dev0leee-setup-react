import html2canvas from 'html2canvas'
import { toCanvas } from 'qrcode'
import { useEffect, useRef } from 'react'

import { QR_CANVAS_SIZE } from '@/features/visit/constants/visit'
import { useLobbyPhoneQrData } from '@/features/visit/queries/useTempPassword'
import { ButtonBase } from '@/shared/components/common/ButtonBase'
import { useResidentDetailInfo } from '@/shared/hooks/useResidentDetailInfo'
import { nativeSendLobbyPhoneQrInfo } from '@/shared/lib/native/lobbyPhone'

/**
 * 1회용 출입 QR (V6).
 * 레거시 `VisitLobbyPhoneQrView.vue` + `VisitLobbyPhoneQrCode.vue` 이식.
 *
 * 서버가 준 **암호화 문자열을 그대로** QR로 그린다 — 가공하지 않는다.
 *
 * ⚠️ **공유는 QR 캔버스가 아니라 카드 전체를 캡처한다.** 제목·QR·동호수가 한 장에
 * 들어가야 해서 `html2canvas`를 쓴다. 그래서 `canvas.toDataURL()`만으로는 대체할 수 없다
 * (`visit.md` V-Q8 — 앱이 카드 전체를 기대하는지 실기기 확인 필요).
 *
 * ⚠️ 레거시는 캡처 대상을 `document.querySelector('.qrContainer')`로 찾고 자식 메서드를
 * `defineExpose`로 노출했다. **ref 하나로 합쳤다** — 결과는 같고 DOM 조회가 사라진다.
 *
 * ⚠️ **300ms 디바운스**로 연타를 막는다. 레거시 `useDebounceFn`과 같은 값이다.
 *
 * ⚠️ 레거시의 빈 `onMounted(async () => {})`는 옮기지 않았다.
 */
export const LobbyPhoneQrPage = () => {
  const { residentDetailInfo } = useResidentDetailInfo()
  const { lobbyPhoneQrData } = useLobbyPhoneQrData()

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const shareTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!lobbyPhoneQrData || !canvasRef.current) return

    // 레거시는 `type: 'image/png'`도 넘겼지만 캔버스 렌더러가 받지 않는 옵션이라 뺐다
    void toCanvas(canvasRef.current, lobbyPhoneQrData, {
      width: QR_CANVAS_SIZE,
      errorCorrectionLevel: 'L',
    })
  }, [lobbyPhoneQrData])

  useEffect(() => {
    return () => {
      if (shareTimerRef.current) clearTimeout(shareTimerRef.current)
    }
  }, [])

  const shareQr = () => {
    if (shareTimerRef.current) clearTimeout(shareTimerRef.current)

    shareTimerRef.current = setTimeout(() => {
      void (async () => {
        if (!cardRef.current) return

        const canvas = await html2canvas(cardRef.current)
        nativeSendLobbyPhoneQrInfo({ qrInfo: canvas.toDataURL('image/png') })
      })()
    }, 300)
  }

  return (
    <div className="h-full w-full overflow-auto bg-defaults-secondary-background-mono px-5 py-6">
      <div className="w-full space-y-4">
        <div
          ref={cardRef}
          className="flex flex-col items-center justify-center gap-4 self-stretch rounded-xl border border-defaults-tertiary-border-tertiary bg-base-b-white pt-[37px] pr-5 pb-[23px] pl-5 shadow-sm"
        >
          <p className="pretendard-20SemiBold text-navy-default-text-navy">
            공동현관 출입 1회용 QR코드
          </p>
          <div className="flex items-center justify-center rounded-md">
            <canvas ref={canvasRef} />
          </div>
          <span className="pretendard-18Bold text-base-b-black">
            {residentDetailInfo?.dong}동 {residentDetailInfo?.ho}호
          </span>
        </div>

        <ButtonBase
          roundType="rounded"
          color="brand"
          className="flex justify-center gap-2"
          onClick={shareQr}
        >
          QR코드 공유
          <img src="/assets/icons/UploadWhite.svg" alt="업로드 아이콘" />
        </ButtonBase>
      </div>
    </div>
  )
}
