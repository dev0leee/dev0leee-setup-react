import { z } from 'zod'

import { PHONE_REGEX } from '@/shared/constants/regex'

/**
 * 하자보수 접수 폼 (RP2·RP3). 레거시 `schemas/repair.js` 이식.
 *
 * ⚠️ **4필드만 검증한다.** `dong`·`ho`·`phone`은 비활성 표시 전용이고 `imageList`는
 * 선택 항목이라 스키마에 없다 — 즉 **완료 버튼의 색은 `위치`와 `접수 내용` 둘로만 갈린다.**
 *
 * ⚠️ **빈 문자열과 `null`을 명시적으로 허용한다** — 선택 항목이 비어 있는 상태를
 * 통과시키려는 것이다. 그래서 `요구사항을 한 글자 이상…`은 실제로는 발동하지 않는다.
 */
export const repairFormSchema = z.object({
  location: z
    .string({ error: '위치를 입력해주세요' })
    .trim()
    .min(1, { message: '위치를 한 글자 이상 입력해주세요' }),
  content: z
    .string({ error: '내용을 입력해주세요' })
    .min(1, { message: '내용을 한 글자 이상 입력해주세요' }),
  emergencyPhone: z
    .union([
      z.string().regex(PHONE_REGEX, '휴대폰 번호 형식으로 - 없이 입력해주세요'),
      z.literal(''),
      z.null(),
    ])
    .optional(),
  requirement: z
    .union([
      z.string().min(1, { message: '요구사항을 한 글자 이상 입력해주세요' }),
      z.literal(''),
      z.null(),
    ])
    .optional(),
})

export type RepairFormValues = z.infer<typeof repairFormSchema>
