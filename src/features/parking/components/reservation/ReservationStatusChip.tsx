import { IN_PARKING_STATUS } from '@/features/parking/constants/parking'
import { ChipBase } from '@/shared/components/common/ChipBase'

/**
 * 입차 상태 칩 (PK11 카드 · PK14 상세).
 * 레거시 `findInParkingStatus` + `getBadgeColorByInParkingStatus`를 한 컴포넌트로 합쳤다 —
 * 두 유틸이 항상 같이 쓰이고, 라벨 문자열로 색을 되찾는 왕복이 사라진다.
 *
 * | 조건                       | 라벨       | 색         |
 * | -------------------------- | ---------- | ---------- |
 * | 이미 입차                  | `입차`     | blue       |
 * | 출차 예정일이 오늘보다 이전 | `미입차`   | deepPurple |
 * | 그 외                      | `입차예정` | orange     |
 *
 * ⚠️ **날짜 비교는 자정 기준이다.** 양쪽 다 `setHours(0,0,0,0)`으로 눌러 시각을 지운다 —
 * 예정일 당일에는 `미입차`가 되지 않는다.
 *
 * ⚠️ **`new Date('YYYY-MM-DD HH:mm:ss')`로 파싱한다.** ISO가 아닌 공백 구분 형식이라
 * 구형 웹뷰에서 `Invalid Date`가 될 수 있다 — 그러면 비교가 항상 거짓이라 `입차예정`으로
 * 보인다. 실기기 확인이 필요하다 (`parking.md` PK-Q4).
 *
 * ⚠️ **`입차` 칩과 `월패드 알림` 칩이 둘 다 파랑이다.** 나란히 서면 구분이 어렵다
 * (`deferred.md`).
 */
export const ReservationStatusChip = ({
  inParkingFlag,
  outParkingScheduledDate,
}: {
  inParkingFlag: boolean | undefined
  outParkingScheduledDate: string | null | undefined
}) => {
  const status = (() => {
    if (inParkingFlag) return IN_PARKING_STATUS.IN

    const scheduledDate = new Date(outParkingScheduledDate ?? '')
    const currentDate = new Date()
    scheduledDate.setHours(0, 0, 0, 0)
    currentDate.setHours(0, 0, 0, 0)

    if (scheduledDate < currentDate) return IN_PARKING_STATUS.NOT_IN

    return IN_PARKING_STATUS.SCHEDULED
  })()

  return (
    <ChipBase color={status.chipColor} variant="fill">
      {status.label}
    </ChipBase>
  )
}
