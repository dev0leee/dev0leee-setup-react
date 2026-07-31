import { APT_CONTENT_NAME } from '@/shared/constants/aptContent'
import { useResidentDetailInfo } from '@/shared/hooks/useResidentDetailInfo'

/** 월패드 UI 판정에서 정기차량 전용 연동까지 인정할지 */
export const WALL_PAD_CAR_TYPE = {
  REGULAR: 'regular',
} as const

/**
 * 월패드 UI 노출 판정. 레거시 `lib/composables/useWallPadContent.js` 이식.
 *
 * 단지가 구독한 **한글 서비스명**으로 판정한다:
 *
 * | 연동                  | 서비스명                | 인정 범위          |
 * | --------------------- | ----------------------- | ------------------ |
 * | 샘물                  | `차량세대통보`          | 모든 차량          |
 * | 외부 업체             | `외부월패드`            | 모든 차량          |
 * | 외부 업체(정기차량만) | `외부월패드(정기차량)`  | `carType='regular'` |
 *
 * ⚠️ **`외부월패드`는 `외부월패드(정기차량)`이 없을 때만 인정된다.** 둘 다 구독한 단지는
 * 정기차량 전용으로 취급된다 — 레거시 조건 그대로다.
 *
 * 🔴 **서비스명을 `trim()` 없이 `===`로 비교한다.** 다른 판정(`hasAptContent`)은 전부
 * `trim()`을 하는데 여기만 안 한다. 서버 값에 공백이 섞이면 **월패드 칩이 통째로 사라진다.**
 * 등가 이관이라 레거시 비교를 그대로 옮겼다 — 서버 응답 확인이 필요하다
 * (`parking.md` PK-Q1).
 *
 * ⚠️ 레거시는 `contentList`를 `ref`에 복사한 뒤 `watch`로 동기화했다. 서버 데이터를
 * 클라이언트 상태에 복사하는 패턴이라(`04-state.md` 위반) **응답에서 직접 파생**시킨다.
 * 렌더 결과는 같다.
 *
 * ⚠️ 레거시의 `hasWallPadAlarmUI`는 **호출부가 없다.** 옮기지 않았다 (`deferred.md`).
 */
export const useWallPadContent = (
  carType?: (typeof WALL_PAD_CAR_TYPE)[keyof typeof WALL_PAD_CAR_TYPE],
) => {
  const { residentDetailInfo } = useResidentDetailInfo()
  const contentList = residentDetailInfo?.contentList

  // 🔴 trim 없음 — 레거시 그대로다 (PK-Q1)
  const hasContent = (name: string) => {
    return Boolean(
      contentList?.some((content) => {
        return content.name === name
      }),
    )
  }

  const hasWallPadAlarm = hasContent(APT_CONTENT_NAME.WALL_PAD)
  const hasExternalWallPadAlarmRegular = hasContent(APT_CONTENT_NAME.WALL_PAD_EXTERNAL_REGULAR)
  const hasExternalWallPadAlarm =
    hasContent(APT_CONTENT_NAME.WALL_PAD_EXTERNAL) && !hasExternalWallPadAlarmRegular

  const hasWallPadUI =
    hasWallPadAlarm ||
    hasExternalWallPadAlarm ||
    (carType === WALL_PAD_CAR_TYPE.REGULAR && hasExternalWallPadAlarmRegular)

  return { hasWallPadUI }
}
