import { useLocation, useNavigate } from 'react-router-dom'

import { useFaceCapture } from '@/features/visit/hooks/useFaceCapture'
import type { FaceRegisterFailState } from '@/features/visit/types/visit'
import { ROUTE_PATH } from '@/shared/constants/routes'

/**
 * 얼굴 등록 실패 (V12).
 * 레거시 `FaceRegisterFailView.vue`(89 LOC) 이식.
 *
 * ⚠️ **에러 모달 대신 전용 화면으로 온다.** 이 도메인만의 패턴이다 — 그래서 여기서 바로
 * 재촬영할 수 있다. 재시도는 V11과 같은 카메라 왕복을 쓴다.
 *
 * ⚠️ **이름·비고·사유를 `location.state`로 받는다.** V10→V11은 쿼리스트링인데 여기만
 * `state`다 (`visit.md` §4-3). 상태가 없으면 빈 문자열로 등록을 시도한다 — 레거시 그대로다.
 *
 * ⚠️ **`홈으로 이동`이 목록(V7)이 아니라 `/main`이다.** 완료 화면(V13)은 목록으로 가는데
 * 실패 화면만 메인으로 간다 (`visit.md` V-Q9). 비대칭을 유지한다.
 *
 * ⚠️ **뒤로가기 버튼이 없다**(`hasBackButton: false`). 다만 네이티브 뒤로가기는 막지
 * 않아서 위저드 중간으로 돌아갈 수 있다 — 레거시도 같다.
 */
export const FaceRegisterFailPage = () => {
  const navigate = useNavigate()
  const { state } = useLocation() as { state: FaceRegisterFailState | null }

  const { openFaceCamera, isFaceRecogPostPending } = useFaceCapture({
    faceRecogName: state?.name ?? '',
    faceRecogDescription: state?.memo ?? '',
  })

  const failReason = state?.reason ?? ''

  return (
    <div className="flex h-full w-full flex-col bg-defaults-primary-background-primary">
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-5">
        <img
          src="/assets/icons/uim-exclamation-circle.svg"
          alt="실패 아이콘"
          className="h-12 w-12"
        />
        <p className="pretendard-20Bold text-defaults-primary-text-primary">
          얼굴 등록 요청에 실패하였습니다.
        </p>
        {failReason && (
          <p className="text-center pretendard-14Regular whitespace-pre-line text-defaults-tertiary-text-tertiary">
            {failReason}
          </p>
        )}
      </div>

      <div className="flex gap-3 px-4 pt-2 pb-3">
        <button
          type="button"
          className="flex h-14 flex-1 items-center justify-center rounded-lg border border-defaults-secondary-border-secondary bg-defaults-primary-background-primary shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)]"
          onClick={() => {
            void navigate(ROUTE_PATH.MAIN)
          }}
        >
          <span className="pretendard-18SemiBold text-defaults-primary-text-primary">
            홈으로 이동
          </span>
        </button>
        <button
          type="button"
          disabled={isFaceRecogPostPending}
          className="flex h-14 flex-1 items-center justify-center rounded-lg bg-brand-default-background-brand shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] disabled:opacity-50"
          onClick={openFaceCamera}
        >
          <span className="pretendard-18SemiBold text-base-b-white">재시도</span>
        </button>
      </div>
    </div>
  )
}
