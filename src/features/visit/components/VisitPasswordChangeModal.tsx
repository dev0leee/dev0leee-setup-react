import { useRef, useState } from 'react'

import { PASSWORD_LENGTH, PASSWORD_MODAL_GUIDE } from '@/features/visit/constants/visit'
import { ButtonBase } from '@/shared/components/common/ButtonBase'
import { ModalBase } from '@/shared/components/common/ModalBase'
import { SpinnerCircle } from '@/shared/components/common/SpinnerCircle'

const DIGIT_INDEXES = Array.from({ length: PASSWORD_LENGTH }, (_, index) => {
  return index
})

/**
 * 비밀번호 4자리 변경 모달. 레거시 `VisitPasswordChangeModal.vue`(135 LOC) 이식.
 * **V2 키오스크와 V3 로비폰이 함께 쓴다** — 제목과 처리 함수만 다르다.
 *
 * ⚠️ **안내문은 항상 `세대 비밀번호`다.** 키오스크 비밀번호를 바꿀 때도 그렇게 나온다 —
 * 제목만 바뀐다. 레거시 그대로다.
 *
 * ⚠️ **실패해도 모달이 닫힌다.** 레거시가 `catch` 뒤에서 무조건 닫는다 — 에러 모달은
 * mutation의 `onError`가 따로 띄우므로 **모달이 닫히고 그 위에 에러 모달이 뜬다.**
 *
 * ⚠️ **백스페이스로 이전 칸에 돌아가지 않는다.** 지워도 포커스가 그대로다.
 * ⚠️ **붙여넣기가 동작하지 않는다.** 4자리를 붙여넣어도 첫 칸에 1자리만 들어간다.
 * 둘 다 레거시 그대로다.
 *
 * ⚠️ 레거시는 `document.getElementById`로 다음 칸에 포커스를 옮긴다. **ref 배열**로
 * 바꿨다 — 동작은 같고 DOM 조회가 사라진다.
 */
export const VisitPasswordChangeModal = ({
  open,
  title,
  isPending,
  onSubmit,
  onClose,
}: {
  open: boolean
  title: string
  isPending: boolean
  /** 실패하면 던진다. 모달은 성패와 무관하게 닫는다 */
  onSubmit: (params: { password: string }) => Promise<unknown>
  onClose: () => void
}) => {
  const [passwords, setPasswords] = useState<string[]>(() => {
    return Array<string>(PASSWORD_LENGTH).fill('')
  })
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const isPasswordComplete = passwords.every((password) => {
    return password.length === 1
  })

  const handleChange = ({ value, index }: { value: string; index: number }) => {
    // 숫자만 남기고 한 글자로 자른다
    const digit = value.replace(/\D/g, '').slice(0, 1)

    setPasswords((previous) => {
      const next = [...previous]
      next[index] = digit
      return next
    })

    if (digit && index < PASSWORD_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!isPasswordComplete) return

    try {
      await onSubmit({ password: passwords.join('') })
    } catch (error) {
      console.error('[VisitPasswordChangeModal] 비밀번호 변경에 실패했습니다.', error)
    }

    // 성공·실패 모두 닫는다 (레거시 동일)
    onClose()
  }

  return (
    <ModalBase open={open} onClose={onClose}>
      <div className="flex w-[334px] max-w-[80vw] flex-col items-center rounded-lg bg-base-b-white">
        <div className="mb-5 flex w-full items-center justify-between p-5 pb-3">
          <h1 className="pretendard-18Bold leading-none tracking-tight text-base-b-black">
            {title}
          </h1>
          <button
            type="button"
            className="flex h-7 w-7 items-center justify-center"
            onClick={onClose}
          >
            <img src="/assets/icons/CloseBold.svg" alt="닫기 아이콘" className="h-3 w-3" />
          </button>
        </div>

        <p className="text-center pretendard-14SemiBold leading-tight text-defaults-primary-text-primary">
          <span>{PASSWORD_MODAL_GUIDE[0]}</span>
          <br />
          <span>{PASSWORD_MODAL_GUIDE[1]}</span>
        </p>

        <div className="flex flex-col items-center justify-center gap-4 p-5">
          <form
            id="passwordForm"
            className="flex items-center justify-center gap-3"
            onSubmit={(event) => {
              void handleSubmit(event)
            }}
          >
            {DIGIT_INDEXES.map((index) => {
              return (
                <input
                  key={index}
                  ref={(element) => {
                    inputRefs.current[index] = element
                  }}
                  id={`passwordInput${index}`}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={passwords[index] ?? ''}
                  className="h-[60px] w-[54px] rounded bg-defaults-secondary-background-mono text-center pretendard-20SemiBold text-defaults-secondary-text-secondary"
                  onChange={(event) => {
                    handleChange({ value: event.target.value, index })
                  }}
                />
              )
            })}
          </form>

          <ButtonBase
            form="passwordForm"
            type="submit"
            roundType="rounded"
            color="brand"
            className="flex justify-center"
            disabled={isPending || !isPasswordComplete}
          >
            {isPending ? <SpinnerCircle /> : <span>변경</span>}
          </ButtonBase>
        </div>
      </div>
    </ModalBase>
  )
}
