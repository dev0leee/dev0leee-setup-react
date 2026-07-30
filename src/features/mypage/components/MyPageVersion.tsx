import { useEffect, useState } from 'react'

import {
  APP_VERSION_STORAGE_KEY,
  APP_VERSION_TEXT,
  INITIAL_APP_VERSION,
} from '@/features/mypage/constants/mypage'
import { useNativeSubscription } from '@/shared/hooks/useNativeSubscription'
import { nativeGetAppVersion, subscribeToAppVersion } from '@/shared/lib/native/common'
import { checkDeviceOs } from '@/shared/lib/native/device'
import { compareSemver } from '@/shared/utils/compareSemver'

/**
 * 앱 버전 표시. 레거시 `MyPageVersion.vue` 이식.
 *
 * ⚠️ **현재 화면에는 항상 `버전 없음`이 뜬다. 그것이 등가 이관의 기대값이다.**
 * 서버 버전을 `localStorage['version']`에서 읽는데 **웹에는 그 키를 쓰는 코드가
 * 하나도 없다** — `getApartmantVersion` API도 호출부가 0곳이다. 네이티브 앱이
 * 직접 써넣지 않는 한 `undefined`이고, `compareSemver`가 `unknown`을 돌려준다
 * (`mypage.md` P-Q2 · `deferred.md` D-44).
 *
 * 죽은 기능처럼 보이지만 지우지 않는다. 앱이 써넣고 있다면 지우는 순간 기능이 사라진다.
 *
 * 순서가 중요하다: **구독을 먼저 걸고 그다음 요청**한다. 앱이 즉시 응답하면
 * 요청 후에 구독을 걸면 놓친다. `useNativeSubscription`은 첫 렌더의 effect에서
 * 구독하므로 아래 `useEffect`(요청)보다 먼저 실행된다 — 훅 호출 순서가 곧 실행 순서다.
 */
export const MyPageVersion = () => {
  const [nativeAppVersion, setNativeAppVersion] = useState(INITIAL_APP_VERSION)
  const [serverAppVersion, setServerAppVersion] = useState<string | undefined>(INITIAL_APP_VERSION)

  useNativeSubscription<string>({
    subscribe: subscribeToAppVersion,
    handler: (version) => {
      setNativeAppVersion(version)
    },
  })

  useEffect(() => {
    // 네이티브에 설치된 앱 버전을 요청한다. 응답은 위 구독으로 온다.
    nativeGetAppVersion()

    // 서버 버전은 네이티브가 써넣었다고 가정된 localStorage에서 읽는다.
    const raw = localStorage.getItem(APP_VERSION_STORAGE_KEY)
    if (!raw) {
      setServerAppVersion(undefined)
      return
    }

    try {
      const stored = JSON.parse(raw) as { appIosVersion?: string; appAndroidVersion?: string }
      const { isIOS } = checkDeviceOs()
      setServerAppVersion(isIOS ? stored.appIosVersion : stored.appAndroidVersion)
    } catch {
      // 레거시도 파싱 실패를 조용히 null로 떨어뜨린다.
      setServerAppVersion(undefined)
    }
  }, [])

  const versionText = () => {
    switch (compareSemver({ currentVersion: nativeAppVersion, targetVersion: serverAppVersion })) {
      case 'latest':
        return APP_VERSION_TEXT.LATEST(nativeAppVersion)
      case 'unknown':
        return APP_VERSION_TEXT.UNKNOWN
      default:
        return APP_VERSION_TEXT.CURRENT(nativeAppVersion)
    }
  }

  return (
    // `cursor-pointer`인데 클릭 핸들러가 없다. 레거시 그대로다 (`broken-styles.md` 대상 아님 —
    // 클래스가 실제로 적용되므로 지우면 커서 모양이 달라진다)
    <span className="cursor-pointer pretendard-12Regular text-defaults-secondary-text-secondary">
      {versionText()}
    </span>
  )
}
