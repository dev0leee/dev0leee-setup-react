type Handler = (payload?: unknown) => void

/**
 * 브릿지 내부 이벤트 버스. 레거시가 쓰던 `mitt` 싱글턴(5 LOC)을 대체한다.
 *
 * 라이브러리를 추가하지 않는다는 규칙 때문에 자체 구현했다(CLAUDE.md).
 * `shared/lib/native/` 밖으로 내보내지 않는다 — 앱 전역 이벤트 버스가 아니라
 * **네이티브 콜백을 React 구독자에게 넘기는 배선**일 뿐이다.
 */
const handlers = new Map<string, Set<Handler>>()

export const on = (type: string, handler: Handler): void => {
  const existing = handlers.get(type)
  if (existing) {
    existing.add(handler)
    return
  }
  handlers.set(type, new Set([handler]))
}

export const off = (type: string, handler: Handler): void => {
  handlers.get(type)?.delete(handler)
}

export const emit = (type: string, payload?: unknown): void => {
  // 순회 중 구독 해제가 일어나도 안전하도록 복사해서 돈다.
  const listeners = handlers.get(type)
  if (!listeners) return

  ;[...listeners].forEach((handler) => {
    handler(payload)
  })
}
