import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { env } from '@/config/env'
import { NOTICE_POPUP_HIDE_COOKIE } from '@/features/board/constants/board'
import { useNoticePopupThumbnail } from '@/features/board/queries/useNoticeDetail'
import { ModalBase } from '@/shared/components/common/ModalBase'
import { boardNoticeDetailPath } from '@/shared/constants/routes'
import { getCookie, setCookieUntilMidnight } from '@/shared/utils/cookie'

/**
 * 공지 팝업 (B21). 레거시 `NoticeBoard/NoticePopupModal.vue` 이식.
 *
 * **라우트가 없다** — 메인 화면이 렌더한다. 썸네일이 있고 생성 7일 이내인 최신 공지가
 * 있으면 4:5 비율로 뜬다.
 *
 * ⚠️ **메인에서 투표 대기 팝업보다 뒤에 렌더해야 한다.** 둘의 z-index가 같아
 * DOM 순서가 곧 우선순위이고, 레거시는 공지가 위에 오게 뒀다.
 *
 * ⚠️ 썸네일을 `object-fill`로 늘린다. 잘리지는 않지만 **원본 비율이 4:5가 아니면
 * 왜곡된다.** 레거시 주석에도 그렇게 적혀 있다.
 *
 * ⚠️ **쿠키가 자정에 만료된다.** 날짜가 바뀌면 저절로 다시 보인다 —
 * 만료 시각을 코드가 관리할 필요가 없다. 투표 팝업(VT10)과 **키가 다르다**
 * (`noticePopupHideToday` vs `hidePopup`). 공용 유틸은 `shared/utils/cookie.ts`다.
 *
 * 레거시는 `watch(..., { immediate: true })`로 열림 상태를 만들지만, 여기서는
 * **응답에서 바로 파생**한다 — 상태가 하나 줄고 첫 렌더에 어긋난 프레임이 없다.
 * `닫기`를 눌렀는지만 상태로 들고 있으면 된다.
 */
export const NoticePopupModal = () => {
  const navigate = useNavigate()
  const { noticePopupThumbnail } = useNoticePopupThumbnail()

  const [isClosed, setIsClosed] = useState(false)
  const [isHideForToday, setIsHideForToday] = useState(() => {
    return getCookie({ name: NOTICE_POPUP_HIDE_COOKIE }) === 'true'
  })

  const isOpen = Boolean(noticePopupThumbnail?.uuid) && !isClosed && !isHideForToday
  if (!isOpen) return null

  return (
    <ModalBase
      open
      // ⚠️ 일부러 아무것도 하지 않는다. 레거시는 `ModalBase`에 `@close`를 연결하지
      // 않아 **배경을 눌러도, Esc를 눌러도 닫히지 않는다** — 아래 두 버튼으로만 닫힌다.
      // 여기서 닫도록 만들면 없던 닫기 경로가 생긴다.
      onClose={() => {
        // no-op (레거시 동작)
      }}
    >
      <div className="flex w-[80vw] max-w-[320px] flex-col">
        <button
          type="button"
          className="aspect-[4/5] w-full overflow-hidden rounded-t-md"
          onClick={() => {
            void navigate(boardNoticeDetailPath({ uuid: noticePopupThumbnail?.uuid ?? '' }))
            setIsClosed(true)
          }}
        >
          <img
            src={`${env.VITE_S3_BUCKET_URL_FILE}${noticePopupThumbnail?.thumbnailFilePath ?? ''}`}
            alt={noticePopupThumbnail?.title}
            className="h-full w-full object-fill"
          />
        </button>

        <div className="flex w-full">
          <button
            type="button"
            className="h-12 flex-1 rounded-bl-md bg-defaults-secondary-background-secondary px-2 pretendard-14SemiBold whitespace-nowrap"
            onClick={() => {
              setCookieUntilMidnight({ name: NOTICE_POPUP_HIDE_COOKIE, value: 'true' })
              setIsHideForToday(true)
              setIsClosed(true)
            }}
          >
            오늘 하루 보지 않기
          </button>
          <button
            type="button"
            className="h-12 flex-1 rounded-br-md bg-brand-default-background-brand px-2 pretendard-14SemiBold whitespace-nowrap text-base-b-white"
            onClick={() => {
              setIsClosed(true)
            }}
          >
            닫기
          </button>
        </div>
      </div>
    </ModalBase>
  )
}
