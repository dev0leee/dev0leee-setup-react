/**
 * 레거시 `src/constants/regex.js` 7종 이식.
 *
 * ⚠️ **패턴을 손대지 않는다.** 검증 통과/실패가 바뀌면 사용자가 넣을 수 있는 값이
 * 달라진다 (`docs/migration/tech-mapping.md` §13 보존 항목 8).
 * 이름도 레거시 그대로 둬서 명세와 대조하기 쉽게 한다.
 */

/** 하이픈이 **포함된** 휴대폰 번호. 앵커가 없어 부분 일치도 통과한다(레거시 원본) */
export const PHONE_REGEX = /(010|011|016|017|018|019)-\d{3,4}-\d{4}/

/** 하이픈이 없는 휴대폰 번호 */
export const PHONE_CUSTOM_REGEX = /^(010|011|016|017|018|019)\d{7,8}$/

/** 자동 하이픈 삽입용 캡처 그룹 */
export const PHONE_AUTO_HYPHEN_REGEX = /(\d{3})(\d{3,4})(\d{4})/

/** 영문 + 숫자 + 특수문자 각 1자 이상, 8자 이상 */
export const PASSWORD_REGEX = /^(?=.*[a-zA-Z])(?=.*[~!@#$%^&*()?])(?=.*[0-9]).{8,}$/

/** 차량 번호. 구형(12가3456) · 신형(서울12가3456) 둘 다 */
export const CARNUM_REGEX = /^(\d{2,3}[가-힣]\d{4}|[가-힣]{2}\d{2}[가-힣]\d{4})$/

/** 닉네임: 한글·영문·숫자 2~10자 */
export const NICKNAME_REGEX = /^[가-힣a-zA-Z0-9]{2,10}$/

/** 이름: 한글·영문·공백 */
export const NAME_REGEX = /^[가-힣a-zA-Z ]+$/

/** userAgent로 OS를 감지한다 (네이티브 브릿지 분기용). 레거시에는 없던 타깃 상수 */
export const IOS_UA_PATTERN = /iPad|iPhone|iPod/
export const ANDROID_UA_PATTERN = /Android/
