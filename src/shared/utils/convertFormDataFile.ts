/**
 * multipart 폼데이터를 조립한다. 레거시 `lib/utils/convertFormDataFile.js` 이식.
 *
 * `fileList` 키만 특별히 다룬다 — 서버가 **인덱스가 박힌 필드명**을 기대한다:
 *
 * ```
 * fileList[0].file      (새로 고른 File)
 * fileList[0].fileUuid  (이미 올라가 있던 이미지)
 * fileList[0].orderNum  (항상)
 * ```
 *
 * ⚠️ **`orderNum`을 배열 순서로 다시 매긴다.** 서버가 준 원래 값은 버린다.
 * 상세 조회에서 `orderNum`으로 다시 정렬하므로 왕복이 일관된다.
 */
export const convertFormDataFile = ({
  fileList,
  ...fields
}: {
  fileList?: (File | { fileUuid?: string })[]
} & Record<string, unknown>): FormData => {
  const formData = new FormData()

  Object.entries(fields).forEach(([key, value]) => {
    formData.append(key, String(value))
  })

  fileList?.forEach((file, index) => {
    if (file instanceof File) {
      formData.append(`fileList[${String(index)}].file`, file)
    } else {
      formData.append(`fileList[${String(index)}].fileUuid`, file.fileUuid ?? '')
    }

    formData.append(`fileList[${String(index)}].orderNum`, String(index))
  })

  return formData
}
