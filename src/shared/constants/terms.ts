import type { TermsItem } from '@/shared/types/terms'

/**
 * 약관 id. **URL의 일부다** (`/termsOfUse/{id}`) — 외부 링크가 걸려 있으므로 바꾸지 않는다.
 * 레거시 `constants/domain/terms.js` 그대로.
 */
export const TERMS_ID = {
  TERMS_AND_CONDITIONS: 'terms-and-conditions',
  PRIVACY_POLICY: 'privacy-policy',
  MARKETING_DATA_CONSENT: 'marketing-data-consent',
  RECEIVE_ADVERTS_CONSENT: 'receive-adverts-consent',
} as const

/**
 * 마케팅·광고성 약관 2건. 회원가입에서는 선택 항목으로, 알림 설정에서는 토글로 쓴다.
 *
 * ⚠️ `label`과 `title`이 다르다. **동의 체크박스는 `label`, 목록·토스트는 `title`**을 쓴다
 * (`mypage.md` P6 — 약관 및 정책 목록이 `title`을 표시한다).
 */
export const MARKETING_TERMS_ITEMS: TermsItem[] = [
  {
    id: TERMS_ID.MARKETING_DATA_CONSENT,
    label: '마케팅 목적의 개인정보 수집 및 이용 동의',
    required: false,
    title: '마케팅 목적의 개인정보 수집 및 이용',
  },
  {
    id: TERMS_ID.RECEIVE_ADVERTS_CONSENT,
    label: '광고성 정보 수신 동의',
    required: false,
    title: '광고성 정보 수신',
  },
]

/** 전체 약관 4건. 순서가 화면 표시 순서다 */
export const TERMS_ITEMS: TermsItem[] = [
  {
    id: TERMS_ID.TERMS_AND_CONDITIONS,
    label: '이용약관 동의',
    required: true,
    title: '서비스 약관',
  },
  {
    id: TERMS_ID.PRIVACY_POLICY,
    label: '개인정보 처리방침 동의',
    required: true,
    title: '개인정보처리방침',
  },
  ...MARKETING_TERMS_ITEMS,
]
