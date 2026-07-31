import { useState } from 'react'
import { useParams } from 'react-router-dom'

import { FaceInfoFields } from '@/features/visit/components/faceRegister/FaceInfoFields'
import { useFaceRecogDetail, usePutFaceRecog } from '@/features/visit/queries/useFaceRecog'

/**
 * 안면인식 정보 수정 (V9).
 * 레거시 `FaceRegisterEditView.vue`(90 LOC) 이식.
 *
 * 🔴 **검증이 없다.** 이름을 다 지우고 `저장`을 눌러도 요청이 나간다. 신규 등록(V10)은
 * 이름이 비면 버튼을 잠그는데 **수정은 안 잠근다** — 비대칭이지만 등가 이관이라 그대로다.
 *
 * ⚠️ **로딩 중에는 빈 화면이다.** `저장` 버튼조차 없다.
 *
 * ⚠️ **입력값을 `useState`로 옮겨 담지 않고 서버 값 위에 덮어쓰는 방식**을 썼다.
 * 레거시는 `watch(face, immediate)`로 상태에 복사했는데, 그러면 재조회 때마다 사용자가
 * 입력하던 값이 서버 값으로 되돌아간다. 여기서는 **사용자가 건드린 뒤에는 서버 값이 와도
 * 유지된다** — 첫 진입 화면은 같고 재조회 시에만 갈린다(레거시 쪽이 사고에 가깝다).
 */
export const FaceRegisterEditPage = () => {
  const { id: faceRecogGuid = '' } = useParams()

  const { faceRecogDetail: face, isFaceRecogDetailLoading } = useFaceRecogDetail({ faceRecogGuid })
  const { putFaceRecogMutation, isFaceRecogPutPending } = usePutFaceRecog()

  const [nameInput, setNameInput] = useState<string | null>(null)
  const [memoInput, setMemoInput] = useState<string | null>(null)

  const name = nameInput ?? face?.residentFaceName ?? ''
  const memo = memoInput ?? face?.faceRecogDescription ?? ''

  return (
    <div className="flex h-full w-full flex-col bg-defaults-primary-background-primary">
      {!isFaceRecogDetailLoading && face && (
        <>
          <div className="flex flex-1 flex-col gap-5 overflow-auto px-5 py-6">
            <FaceInfoFields
              name={name}
              memo={memo}
              onNameChange={setNameInput}
              onMemoChange={setMemoInput}
            />
          </div>

          <div className="px-4 pt-2 pb-3">
            <button
              type="button"
              disabled={isFaceRecogPutPending}
              className="flex h-14 w-full items-center justify-center rounded-lg bg-brand-default-background-brand shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] disabled:opacity-50"
              onClick={() => {
                putFaceRecogMutation({
                  faceRecogGuid,
                  faceRecogName: name,
                  faceRecogDescription: memo,
                })
              }}
            >
              <span className="pretendard-18SemiBold text-base-b-white">저장</span>
            </button>
          </div>
        </>
      )}
    </div>
  )
}
