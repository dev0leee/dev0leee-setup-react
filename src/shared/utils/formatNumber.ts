/**
 * 가격 표시 공통 포맷. 컴포넌트마다 toLocaleString을 직접 부르지 않는다
 * (07-javascript "포맷 함수"). 포맷이 화면마다 갈리면 QA에서야 드러난다.
 */
export const formatPrice = ({ price }: { price: number }): string => {
  return `${price.toLocaleString('ko-KR')}원`
}
