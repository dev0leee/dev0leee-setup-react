import { API_PREFIX } from '@/shared/constants/api'
import { api } from '@/shared/lib/apiClient'

/**
 * 미확인 차량 거부 (PK10).
 *
 * ⚠️ **입출차 건의 uuid를 보내지 않는다.** 차량번호와 사유만 보낸다 — 서버가 세대와
 * 차량번호로 대상을 찾는다. 화면이 들고 있는 uuid는 성공 후 **캐시 무효화에만** 쓰인다.
 *
 * ⚠️ **거부 해제(`postRejectCarRelease`)는 이관하지 않는다** — 레거시에 호출부가 없다
 * (`parking.md` 이관 제외 · E-Q5b).
 */
export const postRejectCar = async ({
  aptResidentUuid,
  carNum,
  reason,
}: {
  aptResidentUuid: string
  /** 🔴 라우터 state에서 온 값이다. 새로고침하면 비어 있다 */
  carNum: string
  reason: string
}): Promise<void> => {
  await api.post(`${API_PREFIX.PARKING}/reject/${aptResidentUuid}`, { carNum, reason })
}
