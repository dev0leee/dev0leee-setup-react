/**
 * 값을 클립보드에 복사한다. 레거시 `lib/utils/copyValue.js` 이식.
 *
 * `navigator.clipboard`를 먼저 쓰고, 안 되면 숨은 `<textarea>` + `execCommand`로 떨어진다.
 *
 * ⚠️ 🔴 **폴백은 성공·실패 양쪽에서 콜백을 부른다.** `execCommand`가 실패해도
 * `클립보드에 복사되었습니다.` 토스트가 뜬다 — 사용자는 복사된 줄 안다.
 * 레거시 그대로다 (`deferred.md`).
 *
 * ⚠️ **값이 비어 있으면 아무것도 하지 않는다** — 콜백도 부르지 않는다.
 */
export const copyValue = async ({
  value,
  onCopied,
}: {
  value: string | undefined
  onCopied: () => void
}): Promise<void> => {
  if (!value) return

  const fallbackCopy = () => {
    const textArea = document.createElement('textarea')
    textArea.value = value
    document.body.appendChild(textArea)
    textArea.select()

    try {
      document.execCommand('copy')
    } catch (error) {
      console.error('[copyValue] 클립보드 폴백 복사에 실패했습니다.', error)
    }

    // 🔴 실패해도 부른다 (레거시 동일)
    onCopied()
    document.body.removeChild(textArea)
  }

  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(value)
      onCopied()
    } catch {
      fallbackCopy()
    }
    return
  }

  fallbackCopy()
}
