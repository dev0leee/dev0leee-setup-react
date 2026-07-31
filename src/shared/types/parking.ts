/**
 * 주차 마일리지(분 단위). `totalMileage`는 서버가 주지 않아 클라이언트가 더해 만든다
 * (레거시 `select` 동일).
 *
 * `shared/`에 있는 이유는 **메인 카드와 주차 화면 두 도메인이 같은 조회를 쓰기 때문**이다.
 * feature는 다른 feature를 import하지 않으므로 공통분모를 여기로 올렸다
 * (`01-folder-structure.md` · `recipe.md` §2).
 */
export interface ParkingMileage {
  useMileage: number
  remainingMileage: number
  totalMileage: number
}

/** 조회 기간. `YYYY-MM-DD` 두 개이며 요청 직전에 시각이 붙는다 */
export interface MileageDateRange {
  startDate: string
  endDate: string
}
