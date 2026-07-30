/**
 * 메인 화면 상수. 레거시가 화면 파일 안에 인라인으로 두거나 여러 곳에 흩어놨던 것을 모았다.
 */

/**
 * ⚠️ **하드코딩된 단지 ID.** 고산디에트르에듀파크(`SMA0002`)에서만 메인 진입 시
 * 네이티브에 입주민 정보를 다시 보낸다.
 *
 * 레거시 주석에 사유가 적혀 있다 — 앱이 `beacon-list` 하위의 `floorNum`만 바뀌면
 * 재요청을 하지 않아서, DB의 `radius` 값을 바꾸고 메인 접속 시 웹이 값을 밀어주는
 * **임시 우회**다. 앱 이슈가 해결됐는지 확인할 가치가 있다
 * (`main.md` M-Q1 · `deferred.md` D-34).
 */
export const BEACON_WORKAROUND_APT_ID = 'SMA0002'

/** 단지 전환 드로어 문구 */
export const APT_DRAWER_TEXT = {
  CLOSE: '닫기',
  WAITING: '승인대기중',
  LOAD_ERROR: ['단지 목록을 불러오지 못했습니다.', '잠시 후 다시 시도해주세요.'],
} as const

/**
 * ⚠️ **`승인되지 않은 단지입니다.` 모달 데이터는 두지 않았다.** 레거시에 값은 있지만
 * 그 모달이 실제로 뜨지 않는다 — 드로어가 먼저 언마운트된다 (`deferred.md` D-216).
 */

/** 드로어 목록 스켈레톤 행 수 */
export const APT_DRAWER_SKELETON_COUNT = 3
