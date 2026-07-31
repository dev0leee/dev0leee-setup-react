import { useParkingRemainingMileage } from '@/shared/hooks/useParkingRemainingMileage'
import { useResidentDetailInfo } from '@/shared/hooks/useResidentDetailInfo'

/**
 * 메인 카드의 이번 달 주차 마일리지.
 *
 * 조회 자체는 `shared/hooks/useParkingRemainingMileage`가 한다 —
 * **주차 도메인(PK1·PK2)이 같은 조회를 쓰기 때문**에 공통분모를 `shared`로 올렸다.
 * 여기 남은 것은 **메인에만 있는 조건**뿐이다.
 *
 * ⚠️ **주차 구독 단지에서만 조회한다.** 레거시의 같은 검사는 `.value`가 빠져 동작하지
 * 않았다. 카드 자체가 주차 구독일 때만 렌더되므로 화면 결과는 같고 불필요한 요청만
 * 사라진다 (`deferred.md` D-218). 주차 화면은 이 게이트를 걸지 않는다 — URL로 직접
 * 들어올 수 있어 레거시와 달라지면 안 된다.
 */
export const useParkingMileage = () => {
  const { hasAptParkingContent } = useResidentDetailInfo()

  return useParkingRemainingMileage({ enabled: hasAptParkingContent })
}
