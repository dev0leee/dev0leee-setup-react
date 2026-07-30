import { useAuthStore } from '@/shared/stores/authStore'

/**
 * 메인 화면 자리.
 *
 * ⚠️ **아직 이관되지 않았다.** Phase 4(기반 구축)의 범위는 HTTP·인증·브릿지·레이아웃
 * 셸까지다. 메인 화면의 카드 그리드·스와이퍼·배너·단지 전환은 Phase 6에서
 * `docs/migration/features/main.md` 명세대로 만든다.
 *
 * 지금 이 화면이 하는 일은 **기반이 실제로 이어지는지 확인**하는 것뿐이다:
 * 로그인 → 토큰 저장 → `/login/info` + 단지 목록 조회 → `aptInfo` 적재 →
 * 네이티브 발신 → 라우터 가드 통과 → 셸(하단 탭) 렌더.
 */
export const MainPage = () => {
  const aptInfo = useAuthStore((state) => {
    return state.aptInfo
  })

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-5">
      <h1 className="pretendard-20Bold text-defaults-primary-text-primary">
        {aptInfo.aptName ?? '단지 정보 없음'}
      </h1>
      <p className="pretendard-15Regular text-defaults-secondary-text-secondary">
        {aptInfo.residentName ? `${aptInfo.residentName}님` : '입주민 정보 없음'}
      </p>
    </div>
  )
}
