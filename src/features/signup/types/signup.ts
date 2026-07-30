/**
 * 가입 위저드가 4단계에 걸쳐 모으는 값.
 *
 * ⚠️ **필드 대부분이 KMC 콜백 쿼리스트링에서 온다.** 어떤 필드를 붙여주는지 문서가 없어
 * 레거시가 `...query`로 전부 받아 스토어에 펼쳐 넣는다. 아래 목록은 `postSignUp` 호출부에서
 * 역산한 것이다 (`signup.md` S-Q4). 그래서 전부 optional이다.
 */
export interface SignUpInfo {
  /** KMC 인증 토큰 */
  apiToken?: string
  /** KMC 인증 번호 */
  certNum?: string
  /** KMC 본인확인 이름. S3 폼의 초기값이 된다 */
  name?: string
  birthDay?: string
  gender?: string
  nation?: string
  /** S3에서 사용자가 입력 */
  nickName?: string
  /** S3에서 사용자가 입력. ⚠️ 메모리에만 있고 저장하지 않는다 */
  password?: string
  /** S1의 선택 동의. 쿼리스트링을 왕복해 문자열로 왔다가 boolean으로 되돌려진다 */
  marketingDataConsentFlag?: boolean
  receiveAdvertsConsentFlag?: boolean
}

export interface SignUpInfoState {
  signUpInfo: SignUpInfo
  /**
   * ⚠️ **병합만 한다. 초기화 기능이 없다.** 레거시 그대로다 —
   * `setSignUpInfo({})`가 아무것도 지우지 않는 이유다 (`deferred.md` D-206).
   */
  setSignUpInfo: (signUpInfo: SignUpInfo) => void
}

/** 아파트 검색 결과 한 건 */
export interface AptSearchResult {
  uuid: string
  name: string
}

/** `POST /sign-up` 요청 본문 14필드 */
export interface SignUpPayload {
  apiToken?: string
  certNum?: string
  nickName?: string
  password?: string
  aptUuid: string
  /** ⚠️ 문자열·숫자 둘 다 허용한다 (레거시 `z.union`) */
  dong: string | number
  ho: string
  householdHeadFlag: boolean
  name?: string
  birthDay?: string
  gender?: string
  nation?: string
  marketingDataConsentFlag?: boolean
  receiveAdvertsConsentFlag?: boolean
}

/** 가입 성공 응답. `id`로 미승인 회원 정보를 조회해 FCM 토큰을 등록시킨다 */
export interface SignUpResult {
  id?: string
}

export interface AptSearchModalProps {
  /** 아파트를 고르면 그 값과 함께, 그냥 닫으면 값 없이 호출된다 */
  onClose: (apt?: AptSearchResult) => void
}

export interface AptSearchItemProps {
  aptInfo: AptSearchResult
  onSelectApt: (apt: AptSearchResult) => void
}
