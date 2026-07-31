import { FACE_NAME_MAX_LENGTH } from '@/features/visit/constants/faceRecog'

const INPUT_CLASS =
  'w-full rounded-lg border border-defaults-secondary-border-secondary bg-defaults-primary-background-primary px-3.5 py-3 pretendard-16Regular text-defaults-primary-text-primary shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] placeholder:text-[#9aa4b2]'

/**
 * 이름 및 별칭 · 비고 입력 두 칸. **V9(수정)과 V10(신규 등록)이 같은 마크업**을 쓴다.
 *
 * ⚠️ **두 필드 모두 10자 제한이고 placeholder도 같다.** 비고에도 이름과 같은 제한이 걸려
 * 있는 것은 레거시 그대로다.
 *
 * ⚠️ **폼 라이브러리를 쓰지 않는다.** 레거시에 검증이 없어서다 — V10은 이름이 비면
 * 버튼을 잠그고, V9는 그마저도 없다(빈 이름으로 저장된다). 재현하려면 상태 2개면 충분하다.
 */
export const FaceInfoFields = ({
  name,
  memo,
  onNameChange,
  onMemoChange,
}: {
  name: string
  memo: string
  onNameChange: (name: string) => void
  onMemoChange: (memo: string) => void
}) => {
  return (
    <>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="faceName" className="pretendard-14Medium text-[#364152]">
          이름 및 별칭
        </label>
        <input
          id="faceName"
          type="text"
          value={name}
          maxLength={FACE_NAME_MAX_LENGTH}
          placeholder="10자 이내 입력"
          className={INPUT_CLASS}
          onChange={(event) => {
            onNameChange(event.target.value)
          }}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="faceMemo" className="pretendard-14Medium text-[#364152]">
          비고
        </label>
        <input
          id="faceMemo"
          type="text"
          value={memo}
          maxLength={FACE_NAME_MAX_LENGTH}
          placeholder="10자 이내 입력"
          className={INPUT_CLASS}
          onChange={(event) => {
            onMemoChange(event.target.value)
          }}
        />
      </div>
    </>
  )
}
