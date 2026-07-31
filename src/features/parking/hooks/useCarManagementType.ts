import { useLocation } from 'react-router-dom'

import { CAR_MANAGEMENT_TYPE } from '@/features/parking/constants/parking'

/**
 * 즐겨찾기/항상허용 판정. 레거시 `lib/composables/useCarManagementType.js` 이식.
 *
 * **경로 문자열에 `alwaysAllow`가 들어 있는지로 정한다** — 라우트 파라미터가 아니다.
 * PK3·PK4가 한 컴포넌트이고 PK5·PK6도 한 컴포넌트라 이 판정이 화면을 가른다.
 *
 * ⚠️ **레거시는 `label`(한글)로 분기하는 곳과 `key`로 분기하는 곳이 섞여 있다.**
 * `'항상허용' === label` 같은 한글 문자열 비교가 조건문에 들어가 있는데, 두 값이 항상
 * 함께 움직이므로 **`key`로 통일해도 결과가 같다.** 여기서는 `key`만 쓴다.
 *
 * ⚠️ 방문예약 등록(PK12·PK13) 경로에는 `alwaysAllow`가 없어 `bookmark`로 판정된다 —
 * 그 화면들이 즐겨찾기 불러오기 드로어를 여는 이유이자, 드로어 카드의 필드 구성이
 * 화면마다 달라지는 이유다 (`CarManagementList` 주석).
 */
export const useCarManagementType = () => {
  const location = useLocation()

  const carManagementType = location.pathname.includes(CAR_MANAGEMENT_TYPE.ALWAYS_ALLOW.key)
    ? CAR_MANAGEMENT_TYPE.ALWAYS_ALLOW
    : CAR_MANAGEMENT_TYPE.BOOKMARK

  return { carManagementType }
}
