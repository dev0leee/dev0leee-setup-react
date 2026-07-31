import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { FaceInfoFields } from '@/features/visit/components/faceRegister/FaceInfoFields'
import { ROUTE_PATH } from '@/shared/constants/routes'

/**
 * 얼굴 신규 등록 — 정보 입력 (V10). 위저드 1/2단계.
 * 레거시 `FaceRegisterFormView.vue`(85 LOC) 이식.
 *
 * ⚠️ **이름만 필수다.** 공백만 입력하면 통과하지 않는다(`trim`).
 * ⚠️ **버튼이 사라지는 게 아니라 `opacity-40` + `disabled`다.**
 *
 * 🔴 **다음 화면으로 이름·비고를 쿼리스트링으로 넘긴다.** 주소창에 입력값이 그대로
 * 노출된다 — 웹뷰라 사용자 눈에는 안 보이지만 히스토리에는 남는다. `location.state`로
 * 옮기면 될 일이지만 **V11이 쿼리스트링에서 읽는 것까지가 레거시 동작**이라 그대로 둔다
 * (`visit.md` §4-3). 같은 위저드의 V12는 `state`를 쓴다 — 전달 방식이 둘로 갈려 있다.
 */
export const FaceRegisterFormPage = () => {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [memo, setMemo] = useState('')

  const isFormValid = name.trim().length > 0

  return (
    <div className="flex h-full w-full flex-col bg-defaults-primary-background-primary">
      <div className="flex flex-1 flex-col gap-8 overflow-auto px-5 py-6">
        <div className="flex flex-col gap-2">
          <span className="pretendard-16SemiBold text-brand-default-text-brand">얼굴 정보</span>
          <h2 className="pretendard-24Bold text-defaults-primary-text-primary">
            등록할 얼굴의
            <br />
            정보를 입력해주세요.
          </h2>
        </div>

        <div className="flex flex-col gap-5">
          <FaceInfoFields name={name} memo={memo} onNameChange={setName} onMemoChange={setMemo} />
        </div>
      </div>

      <div className="px-4 pt-2 pb-3">
        <button
          type="button"
          disabled={!isFormValid}
          className={`flex h-14 w-full items-center justify-center rounded-lg bg-brand-default-background-brand shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] ${
            isFormValid ? 'opacity-100' : 'opacity-40'
          }`}
          onClick={() => {
            if (!isFormValid) return

            const query = new URLSearchParams({ name, memo })
            void navigate(`${ROUTE_PATH.VISIT_FACE_REGISTER_GUIDE}?${query.toString()}`)
          }}
        >
          <span className="pretendard-18SemiBold text-base-b-white">다음</span>
        </button>
      </div>
    </div>
  )
}
