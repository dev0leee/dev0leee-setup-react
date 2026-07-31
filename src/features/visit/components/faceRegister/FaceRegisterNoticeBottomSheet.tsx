import { useState } from 'react'

/**
 * 사진 정보 저장 동의 바텀시트 (V7 → V10 사이).
 * 레거시 `FaceRegisterNoticeBottomSheet.vue` 이식.
 *
 * ⚠️ **동의 체크 전에는 버튼이 비활성 + `opacity-40`이다.**
 * ⚠️ **닫았다 다시 열면 체크가 풀린다** — 레거시는 `watch(isOpen)`으로 초기화했다.
 *   여기서는 열릴 때만 마운트해 **컴포넌트 상태 자체를 새로 만든다**(결과 동일).
 * ⚠️ **딤을 누르면 닫힌다.** 시트 본문 클릭은 전파를 막는다.
 * ⚠️ 공용 `DrawerBase`를 쓰지 않았다 — 딤 `z-[9999]`·라운드·패딩이 레거시 전용값이라
 *   래핑하면 픽셀이 어긋난다.
 */
export const FaceRegisterNoticeBottomSheet = ({
  onClose,
  onConfirm,
}: {
  onClose: () => void
  onConfirm: () => void
}) => {
  const [isAgreed, setIsAgreed] = useState(false)

  const confirm = () => {
    if (!isAgreed) return
    onClose()
    onConfirm()
  }

  return (
    <div
      role="presentation"
      className="fixed top-0 left-0 z-[9999] flex h-full w-full items-end bg-black/50"
      onClick={onClose}
    >
      <div
        role="presentation"
        className="flex w-full flex-col items-center rounded-t-2xl bg-base-b-white"
        onClick={(event) => {
          event.stopPropagation()
        }}
      >
        <div className="flex w-full flex-col items-center gap-3 p-5">
          <img
            src="/assets/icons/uim-exclamation-circle.svg"
            alt="알림 아이콘"
            className="h-8 w-8"
          />

          <div className="flex flex-col items-center gap-[9px] text-center">
            <h3 className="pretendard-20Bold text-defaults-primary-text-primary">
              사진 정보 저장 알림
            </h3>
            <p className="pretendard-14Regular text-[#697586]">
              출입 등록을 위해 사용자 사진을 서버에 저장하고
              <br />
              로비폰으로 전송합니다. 동의하시겠어요?
            </p>
          </div>

          <button
            type="button"
            className="flex w-full items-center justify-center gap-[11px] py-2"
            onClick={() => {
              setIsAgreed((agreed) => {
                return !agreed
              })
            }}
          >
            <img
              src={
                isAgreed ? '/assets/icons/CheckboxBaseOn.svg' : '/assets/icons/CheckboxBaseOff.svg'
              }
              alt={isAgreed ? '동의함' : '동의안함'}
              className="h-5 w-5"
            />
            <span className="pretendard-16SemiBold text-defaults-primary-text-primary">
              위 내용에 동의합니다.
            </span>
          </button>
        </div>

        <div className="w-full px-4 pt-2 pb-3">
          <button
            type="button"
            disabled={!isAgreed}
            className={`w-full rounded-lg bg-brand-default-background-brand py-4 pretendard-18SemiBold text-base-b-white shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] ${
              isAgreed ? '' : 'opacity-40'
            }`}
            onClick={confirm}
          >
            등록 진행하기
          </button>
        </div>
      </div>
    </div>
  )
}
