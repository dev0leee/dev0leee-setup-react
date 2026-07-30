/**
 * localStorage에 JSON을 읽고 쓴다. VueUse `useStorage`의 JSON serializer 대체물.
 *
 * 레거시가 `aptInfo`·`voteCertInfo`·`surveyCertInfo`를 이 형태로 저장해뒀다.
 * 값이 없거나 깨졌을 때 `fallback`을 주는 동작까지 같다 — 깨진 값 하나로
 * 앱이 못 뜨는 상황을 만들지 않는다.
 */
export const readJsonStorage = <T>({ key, fallback }: { key: string; fallback: T }): T => {
  const raw = localStorage.getItem(key)
  if (!raw) return fallback

  try {
    return JSON.parse(raw) as T
  } catch (error) {
    console.warn(`[jsonStorage] ${key} 파싱에 실패했습니다.`, error)
    return fallback
  }
}

export const writeJsonStorage = ({ key, value }: { key: string; value: unknown }): void => {
  if (value === null) {
    localStorage.removeItem(key)
    return
  }
  localStorage.setItem(key, JSON.stringify(value))
}
