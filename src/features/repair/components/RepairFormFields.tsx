import { type Control, Controller, type FieldErrors } from 'react-hook-form'

import type { RepairFormValues } from '@/features/repair/schemas/repair'
import { InputBase } from '@/shared/components/common/InputBase'
import { TextError } from '@/shared/components/common/TextError'

/**
 * 접수 폼의 입력 7칸 (RP2·RP3). 레거시 `RepairFormDetail.vue`(146 LOC) 이식.
 *
 * ⚠️ **앞 3칸(`동`·`호수`·`연락처`)은 항상 비활성**이고 세대 정보로 채워진다.
 * 검증도 받지 않고 서버로도 가지 않는다 — 서버가 `aptResidentUuid`로 안다.
 *
 * 🔴 **`연락처`의 비활성 배경만 다른 회색이다** (`-secondary`, 나머지는 `-mono`).
 * 나란히 놓인 세 칸의 색이 갈린다 (`repair.md` RP-Q9). 레거시 그대로 옮겼다.
 *
 * 🔴 **`기타 요청 사항`에는 에러를 띄울 자리가 없다.** 스키마는 문구를 만들지만 화면에
 * 표시할 곳이 없다 — 빈 문자열이 허용돼서 실제로 발동하지는 않는다.
 *
 * ✅ **textarea 테두리를 `border-defaults-tertiary-border-tertiary`로 정했다.**
 * 레거시 `border-bg-gray`는 생성되지 않는 클래스였다 (RP-Q10 확정 · `broken-styles.md` §5).
 */
const DISABLED_INPUT_CLASS =
  'w-full rounded-lg border border-defaults-tertiary-border-tertiary px-4 py-3 pretendard-15Regular disabled:bg-defaults-secondary-background-mono'

const TEXTAREA_CLASS =
  'w-full resize-none rounded-lg border border-defaults-tertiary-border-tertiary px-4 py-3 pretendard-15Regular focus:outline-none'

export const RepairFormFields = ({
  control,
  errors,
  dong,
  ho,
  phone,
}: {
  control: Control<RepairFormValues>
  errors: FieldErrors<RepairFormValues>
  dong: string
  ho: string
  phone: string
}) => {
  return (
    <div className="space-y-6">
      <div className="flex gap-3">
        <div className="w-full space-y-3">
          <label htmlFor="dong" className="flex gap-1 pretendard-15SemiBold">
            동
          </label>
          <InputBase
            id="dong"
            type="text"
            maxLength={5}
            placeholder="동 입력"
            value={dong}
            isDisabled
            className={DISABLED_INPUT_CLASS}
            onChange={() => {
              // 비활성이라 호출되지 않는다
            }}
          />
        </div>
        <div className="w-full space-y-3">
          <label htmlFor="ho" className="flex gap-1 pretendard-15SemiBold">
            호수
          </label>
          <InputBase
            id="ho"
            type="text"
            maxLength={5}
            placeholder="호수 입력"
            value={ho}
            isDisabled
            className={DISABLED_INPUT_CLASS}
            onChange={() => {
              // 비활성이라 호출되지 않는다
            }}
          />
        </div>
      </div>

      <div className="space-y-3">
        <label htmlFor="phone" className="flex gap-1 pretendard-15SemiBold">
          연락처
        </label>
        {/* 🔴 이 칸만 배경색이 다르다 (RP-Q9) */}
        <InputBase
          id="phone"
          type="tel"
          maxLength={13}
          placeholder="휴대폰 번호(- 없이 숫자만 입력)"
          value={phone}
          isDisabled
          className="w-full rounded-lg border border-defaults-tertiary-border-tertiary px-4 py-3 pretendard-15Regular disabled:bg-defaults-secondary-background-secondary"
          onChange={() => {
            // 비활성이라 호출되지 않는다
          }}
        />
      </div>

      <div className="space-y-3">
        <label htmlFor="emergencyPhone" className="flex gap-1 pretendard-15SemiBold">
          비상 연락처(선택)
        </label>
        <Controller
          name="emergencyPhone"
          control={control}
          render={({ field }) => {
            return (
              <InputBase
                id="emergencyPhone"
                type="tel"
                maxLength={13}
                placeholder="휴대폰 번호(- 없이 숫자만 입력)"
                value={field.value ?? ''}
                className="w-full rounded-lg border border-defaults-tertiary-border-tertiary px-4 py-3 pretendard-15Regular"
                onChange={field.onChange}
                onBlur={field.onBlur}
              />
            )
          }}
        />
        <TextError>{errors.emergencyPhone?.message}</TextError>
      </div>

      <div className="space-y-3">
        <label htmlFor="location" className="flex gap-1 pretendard-15SemiBold">
          위치
          <span className="text-alerts-error-text-error">*</span>
        </label>
        <Controller
          name="location"
          control={control}
          render={({ field }) => {
            return (
              <InputBase
                id="location"
                type="text"
                maxLength={20}
                placeholder="ex) 거실, 발코니, 화장실 등"
                value={field.value ?? ''}
                className="w-full rounded-lg border border-defaults-tertiary-border-tertiary px-4 py-3 pretendard-15Regular"
                onChange={field.onChange}
                onBlur={field.onBlur}
              />
            )
          }}
        />
        <TextError>{errors.location?.message}</TextError>
      </div>

      <div className="space-y-3">
        <label htmlFor="content" className="flex gap-1 pretendard-15SemiBold">
          접수 내용
          <span className="text-alerts-error-text-error">*</span>
        </label>
        <Controller
          name="content"
          control={control}
          render={({ field }) => {
            return (
              <textarea
                id="content"
                rows={7}
                maxLength={200}
                placeholder="하자 내용을 상세히 작성해주세요"
                className={TEXTAREA_CLASS}
                value={field.value ?? ''}
                onChange={field.onChange}
                onBlur={field.onBlur}
              />
            )
          }}
        />
        <TextError>{errors.content?.message}</TextError>
      </div>

      <div className="space-y-3">
        <label htmlFor="requirement" className="flex gap-1 pretendard-15SemiBold">
          기타 요청 사항(선택)
        </label>
        <Controller
          name="requirement"
          control={control}
          render={({ field }) => {
            return (
              <textarea
                id="requirement"
                rows={7}
                maxLength={200}
                placeholder="ex) 방문 희망 날짜, 추가 요청사항 등"
                className={TEXTAREA_CLASS}
                value={field.value ?? ''}
                onChange={field.onChange}
                onBlur={field.onBlur}
              />
            )
          }}
        />
        {/* 🔴 레거시에 에러 표시 자리가 없다. 그대로 둔다 */}
      </div>
    </div>
  )
}
