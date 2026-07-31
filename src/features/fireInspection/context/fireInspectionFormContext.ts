import { createContext, useContext } from 'react'

import type { FireInspectionFormValue } from '@/features/fireInspection/hooks/useFireInspectionForm'

/**
 * 점검표 작성 상태를 트리에 내린다.
 *
 * ✅ **레거시는 composable 반환 객체를 `FireInspectionCategory` → `FireInspectionItem`으로
 * 2단 props drilling 했다.** 프로젝트 규칙이 금지하는 패턴이라 Context로 바꿨다 —
 * 화면 동작은 동일하다 (`fire-inspection.md` §3).
 *
 * ⚠️ Vue에서는 props로 넘어간 ref가 자동 언랩되지 않아 자식이 `.value`를 직접 읽었다.
 * React에는 그 개념이 없으므로 값으로 바로 쓴다 — 옮길 때 놓치기 쉬운 지점이었다.
 *
 * ⚠️ **Provider 컴포넌트를 따로 두지 않는다.** 화면 하나(F2)만 쓰는 컨텍스트라
 * 래퍼를 만들면 이 파일이 컴포넌트와 훅을 함께 내보내게 된다(fast-refresh 경고).
 */
export const FireInspectionFormContext = createContext<FireInspectionFormValue | null>(null)

export const useFireInspectionFormContext = (): FireInspectionFormValue => {
  const context = useContext(FireInspectionFormContext)

  if (!context) {
    throw new Error('FireInspectionFormContext.Provider 안에서만 쓸 수 있습니다.')
  }

  return context
}
