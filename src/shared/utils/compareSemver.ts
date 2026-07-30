/** 비교 결과. `unknown`은 한쪽 버전을 모른다는 뜻이다 */
export type SemverComparison = 'latest' | 'ahead' | 'outdated' | 'unknown'

/**
 * 두 버전을 major·minor·patch 순으로 비교한다. 레거시 `lib/utils/compareSemver.js` 이식.
 *
 * ⚠️ **한쪽이라도 비어 있으면 `unknown`이다.** 마이페이지 앱 버전 표시가 이 분기에
 * 걸려 항상 `버전 없음`을 그린다 — 서버 버전을 `localStorage['version']`에서 읽는데
 * 그 키를 쓰는 코드가 없다 (`mypage.md` P-Q2 · `deferred.md` D-44).
 *
 * ⚠️ **숫자가 아닌 조각은 `NaN`이 되고 모든 비교가 false가 된다** → `latest`로 떨어진다.
 * `1.2.3-beta`처럼 접미사가 붙은 버전이 오면 그렇게 된다. 레거시와 같은 동작이다.
 */
export const compareSemver = ({
  currentVersion,
  targetVersion,
}: {
  currentVersion: string | undefined
  targetVersion: string | undefined
}): SemverComparison => {
  if (!currentVersion || !targetVersion) return 'unknown'

  const [currentMajor, currentMinor, currentPatch] = currentVersion.split('.').map(Number)
  const [targetMajor, targetMinor, targetPatch] = targetVersion.split('.').map(Number)

  const comparePart = (current: number | undefined, target: number | undefined) => {
    if (current === undefined || target === undefined) return null
    if (current > target) return 'ahead' as const
    if (current < target) return 'outdated' as const
    return null
  }

  return (
    comparePart(currentMajor, targetMajor) ??
    comparePart(currentMinor, targetMinor) ??
    comparePart(currentPatch, targetPatch) ??
    'latest'
  )
}
