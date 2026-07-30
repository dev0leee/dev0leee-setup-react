/**
 * 휴대폰 번호에서 하이픈을 제거한다. 레거시 `lib/utils/cleanPhoneHyphen.js` 이식.
 *
 * 저장(localStorage `userAuthInfo`)에는 사용자가 입력한 원본을 그대로 두고,
 * 서버로 보낼 때만 이 함수를 통과시킨다 — 레거시와 같은 비대칭이다.
 */
export const cleanPhoneHyphen = ({ phone }: { phone: string }): string => {
  return phone.replace(/-/g, '')
}
