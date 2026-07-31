import { CAR_ERROR_MESSAGE } from '@/features/parking/constants/parking'
import type { ApiError } from '@/shared/lib/apiErrors'
import { showErrorModal } from '@/shared/lib/errorModal'

/**
 * 차량관리 mutation 실패 처리. 레거시가 훅마다 복사해 둔 `switch (errorCode)`를 모은 것이다.
 *
 * ⚠️ **`handledCodes`를 호출부가 명시적으로 넘긴다.** 훅마다 전용 문구로 바꿔주는 코드
 * 집합이 다르기 때문이다 — 목록에 없으면 **서버 원문 `message`가 그대로 보인다.**
 * 한 표로 합치면 수정·삭제 화면에서 사용자가 보는 문구가 달라진다
 * (`parking.md` §PK3·§PK5 에러 분기표).
 */
export const showCarMutationError = ({
  error,
  handledCodes,
}: {
  error: ApiError
  handledCodes: readonly string[]
}): void => {
  if (error.code && handledCodes.includes(error.code)) {
    showErrorModal({ text: CAR_ERROR_MESSAGE[error.code] })
    return
  }

  showErrorModal({ text: error.message })
}
