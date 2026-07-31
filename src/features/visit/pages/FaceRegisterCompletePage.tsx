import { useNavigate } from 'react-router-dom'

import { ROUTE_PATH } from '@/shared/constants/routes'

/**
 * 얼굴 등록 완료 (V13).
 * 레거시 `FaceRegisterCompleteView.vue`(47 LOC) 이식.
 *
 * 등록 요청이 접수됐을 뿐 승인은 아직이라, 목록에서는 `등록대기`로 보인다.
 *
 * ⚠️ **버튼이 목록(V7)으로 간다.** 실패 화면(V12)의 `홈으로 이동`은 `/main`이다 — 비대칭.
 */
export const FaceRegisterCompletePage = () => {
  const navigate = useNavigate()

  return (
    <div className="flex h-full w-full flex-col bg-defaults-primary-background-primary">
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-5">
        <img src="/assets/icons/UimCheckCircle.svg" alt="완료 아이콘" className="h-12 w-12" />
        <p className="pretendard-20Bold text-defaults-primary-text-primary">
          안면인식 얼굴 등록 요청이 완료되었습니다.
        </p>
        <p className="text-center pretendard-14Regular whitespace-pre-line text-defaults-tertiary-text-tertiary">
          등록 승인 및 로비폰 배포까지는 최대 10분이 소요됩니다. 잠시만 기다려주세요.
        </p>
      </div>

      <div className="px-4 pt-2 pb-3">
        <button
          type="button"
          className="flex h-14 w-full items-center justify-center rounded-lg bg-brand-default-background-brand shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)]"
          onClick={() => {
            void navigate(ROUTE_PATH.VISIT_FACE_REGISTER_MANAGEMENT)
          }}
        >
          <span className="pretendard-18SemiBold text-base-b-white">얼굴 등록 내역 확인</span>
        </button>
      </div>
    </div>
  )
}
