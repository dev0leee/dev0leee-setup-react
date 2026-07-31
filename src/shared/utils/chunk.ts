/**
 * 배열을 고정 크기로 자른다. 레거시가 쓰던 lodash `chunk` 대체물.
 *
 * lodash를 추가하지 않은 이유: 이 프로젝트에서 필요한 lodash 함수가 이것 하나뿐이고
 * 구현이 세 줄이다. 동작은 lodash와 맞췄다 — `size`가 1 미만이면 빈 배열을 준다.
 */
export const chunk = <T>({ items, size }: { items: T[]; size: number }): T[][] => {
  if (size < 1) return []

  return Array.from({ length: Math.ceil(items.length / size) }, (_, index) => {
    return items.slice(index * size, index * size + size)
  })
}
