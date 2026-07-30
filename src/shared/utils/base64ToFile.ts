/**
 * base64 시작 패턴으로 MIME 타입을 판별한다.
 * 각 포맷의 magic bytes를 base64로 인코딩하면 항상 같은 접두사가 된다.
 */
const detectMimeType = ({ base64Data }: { base64Data: string }): string => {
  if (base64Data.startsWith('/9j/')) return 'image/jpeg'
  if (base64Data.startsWith('iVBO')) return 'image/png'
  // 알 수 없으면 jpeg로 둔다 (레거시 기본값)
  return 'image/jpeg'
}

/**
 * base64 또는 data URL 문자열을 `File`로 바꾼다. 레거시 `lib/utils/base64ToFile.js` 이식.
 *
 * `atob()`은 순수 base64만 받으므로 data URL의 메타 접두사를 잘라낸다.
 * 서명 캔버스(`toDataURL()`)와 안면인식 브릿지(`CALLBACK_FACE_IMAGE`)가 쓴다.
 */
export const base64ToFile = ({
  base64String,
  fileName,
}: {
  base64String: string
  fileName: string
}): File => {
  const base64Data = base64String.includes(',') ? (base64String.split(',')[1] ?? '') : base64String

  const mimeType = detectMimeType({ base64Data })

  const blob = new Blob(
    [
      Uint8Array.from(atob(base64Data), (character) => {
        return character.charCodeAt(0)
      }),
    ],
    { type: mimeType },
  )

  return new File([blob], fileName, { type: mimeType })
}
