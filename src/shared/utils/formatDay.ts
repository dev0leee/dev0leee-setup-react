/**
 * 서버 요일 코드를 한글로. 레거시 `lib/utils/formatDay.js` 이식.
 *
 * ⚠️ **모르는 값은 그대로 돌려준다.** 서버가 새 코드를 보내면 영문이 그대로 보이는데,
 * 빈 문자열이나 `-`로 바꾸면 정보가 사라진다. 레거시 폴백 그대로다.
 *
 * `LUNCH_TIME`이 요일 목록에 섞여 있는 것도 서버 계약이다 —
 * 관리사무소 운영시간은 요일과 점심시간을 한 목록으로 준다.
 */
const DAY_LABEL: Record<string, string> = {
  MONDAY: '월요일',
  TUESDAY: '화요일',
  WEDNESDAY: '수요일',
  THURSDAY: '목요일',
  FRIDAY: '금요일',
  SATURDAY: '토요일',
  SUNDAY: '일요일',
  LUNCH_TIME: '점심시간',
}

export const formatDay = ({ dayType }: { dayType: string | undefined }): string => {
  if (!dayType) return ''
  return DAY_LABEL[dayType] ?? dayType
}
