import { useNavigate } from 'react-router-dom'

import { env } from '@/config/env'
import { CertButton } from '@/shared/components/common/CertButton'
import { TermsCheckboxList } from '@/shared/components/common/TermsCheckboxList'
import { ROUTE_PATH } from '@/shared/constants/routes'
import { TERMS_ITEMS } from '@/shared/constants/terms'
import { useTermsAgreement } from '@/shared/hooks/useTermsAgreement'
import { KMC_TYPE, type TermsAgreeFormProps } from '@/shared/types/cert'

/**
 * 약관 동의 폼 + 본인인증 버튼. 레거시 `views/TermsOfUseView/TermsOfUseAgreeView.vue` 이식.
 *
 * **`shared`에 있는 이유**: 회원가입(S1)과 버전1 전환(A5)이 **같은 폼을 공유한다.**
 * feature가 다른 feature를 import하지 않으므로 공용으로 올렸다. 버튼 문구와 콜백 경로만
 * 다르고 나머지는 완전히 같다.
 *
 * ⚠️ **`tr_url`은 절대 URL이어야 한다.** KMC가 외부에서 우리 앱으로 돌려보내기 때문이다.
 * `env.VITE_BASE_URL` + 콜백 경로 + 선택 동의 쿼리스트링을 여기서 조합한다.
 *
 * ⚠️ 레거시 `<style scoped>`의 `.fixed-width`(`width: calc(100% - 32px)`)를 임의값
 * 클래스로 옮겼다. 부모의 `left-4`(16px)와 짝을 이뤄 양쪽 16px 여백을 만든다.
 */
export const TermsAgreeForm = ({ certButtonText, certResponsePath }: TermsAgreeFormProps) => {
  const navigate = useNavigate()
  const {
    agreedState,
    isAllAgreed,
    isAllRequiredAgreed,
    changeAgreedState,
    toggleAllAgreed,
    consentQueryString,
  } = useTermsAgreement({ items: TERMS_ITEMS })

  return (
    <>
      <form>
        {/* 모두 동의 */}
        <label
          htmlFor="all"
          className="mb-7 flex cursor-pointer items-center gap-3 border-b border-defaults-tertiary-border-tertiary pb-7"
        >
          <input
            id="all"
            type="checkbox"
            className="h-5 w-5"
            checked={isAllAgreed}
            onChange={toggleAllAgreed}
          />
          <p className="pretendard-16SemiBold text-defaults-primary-text-primary">모두 동의</p>
        </label>

        <TermsCheckboxList
          items={TERMS_ITEMS}
          checkedMap={agreedState}
          listClassName="space-y-5"
          textClassName="pretendard-16Regular"
          onChange={changeAgreedState}
          onMoveDetail={(item) => {
            void navigate(`${ROUTE_PATH.TERMS_OF_USE_DETAIL}/${item.id}`)
          }}
        />
      </form>

      <CertButton
        responseUrl={`${env.VITE_BASE_URL}${certResponsePath}?${consentQueryString}`}
        text={certButtonText}
        type={KMC_TYPE.JOIN}
        disabled={!isAllRequiredAgreed}
        className="fixed bottom-4 left-4 w-[calc(100%-32px)]"
      />
    </>
  )
}
