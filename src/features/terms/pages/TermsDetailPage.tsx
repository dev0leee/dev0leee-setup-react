import { useParams } from 'react-router-dom'

import { getMainEnv } from '@/config/env'
import { IframeBase } from '@/shared/components/common/IframeBase'
import { TERMS_ITEMS } from '@/shared/constants/terms'

/**
 * 약관 상세 (T1). 레거시 `TermsOfUseView/TermsOfUseDetailView.vue` 이식.
 *
 * **본문은 별도 앱(`apt-terms`)이 제공하고 iframe으로 띄운다.**
 * `VITE_TERMS_URL`은 **메인 앱 전용 변수**라 `env`가 아니라 `getMainEnv()`로 읽는다 —
 * opinion 빌드에는 주입되지 않는다 (`config/env.ts`).
 *
 * 두 곳에서 들어온다 — 회원가입 약관 동의(S1)의 `보기`와 마이페이지 약관 및 정책(P6).
 * 그래서 signup이 아니라 독립 슬라이스다. `authOptional`이라 로그인 여부를 묻지 않는다.
 *
 * ⚠️ **알 수 없는 `termsId`면 AppBar만 있는 빈 화면이 된다.** 레거시에 에러 처리가 없다
 * (`deferred.md` D-28). `docs/conventions/08-routing.md`는 `useParams` 결과를 검증하라고
 * 하지만, 검증을 추가하면 동작이 달라진다 — 등가 이관이 우선이다.
 */
export const TermsDetailPage = () => {
  const { termsId } = useParams()

  const termsItem = TERMS_ITEMS.find((item) => {
    return item.id === termsId
  })

  return (
    <section className="h-full w-full">
      {termsItem && (
        <IframeBase
          title={termsItem.title}
          src={`${getMainEnv().VITE_TERMS_URL}/${termsItem.id}`}
        />
      )}
    </section>
  )
}
