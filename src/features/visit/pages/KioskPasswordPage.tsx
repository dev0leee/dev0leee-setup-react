import { useState } from 'react'

import { VisitPasswordChangeModal } from '@/features/visit/components/VisitPasswordChangeModal'
import { KIOSK_PASSWORD_MENU, PASSWORD_MODAL_TITLE } from '@/features/visit/constants/visit'
import {
  useChangeKioskPassword,
  useVisitorPassPassword,
} from '@/features/visit/queries/useVisitPassword'
import { SpinnerDots } from '@/shared/components/common/SpinnerDots'

/**
 * 현재 비밀번호 확인 모달. 레거시 `VisitKioskPasswordCheckModal.vue`(49 LOC) 이식.
 *
 * ⚠️ **`ModalBase`를 쓰지 않고 자체 구현이다.** 그래서 `z-[110]`이고 배경 스크롤도
 * 잠기지 않는다. **`SpinnerDots`가 `z-[9999]`라 로딩 중에는 스피너가 모달을 덮는다.**
 * 전부 레거시 그대로다.
 *
 * ⚠️ 레거시는 비밀번호 **문자열을 `v-for`로 순회**하고 `:key`에 숫자 값을 넣어,
 * `1123`처럼 같은 숫자가 반복되면 키가 충돌했다. **인덱스 키로 옮겼다** — 렌더 결과는
 * 같고 충돌만 사라진다 (`visit.md` V-Q4).
 */
const KioskPasswordCheckModal = ({ onClose }: { onClose: () => void }) => {
  const { visitorPassPassword, isVisitorPassPasswordLoading } = useVisitorPassPassword({
    enabled: true,
  })

  const digits = Array.from(visitorPassPassword?.password ?? '')

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-base-b-black/50"
      onClick={onClose}
    >
      <div
        className="flex w-[334px] flex-col items-center rounded-lg bg-base-b-white"
        onClick={(event) => {
          event.stopPropagation()
        }}
      >
        <div className="flex w-full flex-col items-center">
          <div className="flex w-full items-center justify-between p-5 pb-3">
            <span className="pretendard-18Bold">현재 비밀번호 확인</span>
            <button type="button" className="h-7 w-7" onClick={onClose}>
              <img src="/assets/icons/CloseBold.svg" alt="닫기 아이콘" className="h-3 w-3" />
            </button>
          </div>

          {isVisitorPassPasswordLoading ? (
            <SpinnerDots />
          ) : (
            <ul className="flex items-center justify-center gap-3 p-5">
              {digits.map((digit, index) => {
                return (
                  <li
                    key={index}
                    className="flex h-[60px] w-[54px] items-center justify-center rounded bg-defaults-secondary-background-mono pretendard-20SemiBold text-defaults-secondary-text-secondary"
                  >
                    {digit}
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * 방문증 키오스크 설정 (V2). 레거시 `VisitKioskView.vue`(59 LOC) 이식.
 *
 * 메뉴 두 줄이 각각 다른 모달을 연다.
 *
 * ⚠️ **`<li>`에 클릭을 건다**(`<button>`이 아니다). 키보드로 조작할 수 없다. 레거시 그대로다.
 */
export const KioskPasswordPage = () => {
  const [openModal, setOpenModal] = useState<'check' | 'change' | null>(null)

  const { changeKioskPassword, isChangeKioskPasswordPending } = useChangeKioskPassword()

  return (
    <ul className="h-full w-full px-5 py-4">
      {KIOSK_PASSWORD_MENU.map((item) => {
        return (
          <li
            key={item.label}
            className="flex w-full cursor-pointer items-center justify-between px-2.5 py-2 text-center pretendard-15SemiBold"
            onClick={() => {
              setOpenModal(item.action)
            }}
          >
            <span>{item.label}</span>
            <img className="h-6 w-6" src="/assets/icons/ArrowRight.svg" alt="화살표 아이콘" />
          </li>
        )
      })}

      {openModal === 'check' && (
        <KioskPasswordCheckModal
          onClose={() => {
            setOpenModal(null)
          }}
        />
      )}

      <VisitPasswordChangeModal
        open={openModal === 'change'}
        title={PASSWORD_MODAL_TITLE.kiosk}
        isPending={isChangeKioskPasswordPending}
        onSubmit={changeKioskPassword}
        onClose={() => {
          setOpenModal(null)
        }}
      />
    </ul>
  )
}
