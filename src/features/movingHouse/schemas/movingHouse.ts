import { z } from 'zod'

import { startOfDay } from '@/features/movingHouse/lib/movingHouseDate'
import { NAME_REGEX, PHONE_REGEX } from '@/shared/constants/regex'

/**
 * MH3 작성 폼. 레거시 `schemas/movingHouse.js`의 `buildMovingHouseFormSchema` 이식.
 *
 * ⚠️ **`chargeFlag`가 스키마를 바꾼다.** 사용료를 받는 단지에서만 `depositorName`이
 * 필수다 — 그렇지 않으면 입력칸 자체가 없어 검증에서도 빠져야 `다음`이 활성화된다.
 *
 * ⚠️ **`depositorName`의 에러 문구가 `이름을 입력해주세요`다** — 레거시가 공용 `name`
 * 필드를 그대로 쓰기 때문이다. 라벨은 `입금자명`인데 에러는 `이름`이라고 나온다.
 * 등가 이관이라 그대로 뒀다 (`moving-house.md` MH-Q1 · `deferred.md` D-102).
 *
 * ⚠️ **`emergencyPhone`은 `PHONE_REGEX`(하이픈 포함)를 요구한다.** placeholder는
 * "- 없이"라고 하지만 입력하는 동안 화면이 하이픈을 넣어준다 — 투표·로그인과 같은 구조다.
 */
export const createMovingHouseFormSchema = ({ chargeFlag = false }: { chargeFlag?: boolean }) => {
  return z.object({
    moveType: z.string({ error: '유형을 선택해주세요' }),
    moveDate: z.date({ error: '날짜를 선택해주세요' }).refine(
      (date) => {
        return startOfDay(date) >= startOfDay(new Date())
      },
      { message: '오늘 이후 날짜를 선택해주세요' },
    ),
    moveTime: z.string({ error: '시간대를 선택해주세요' }),
    depositorName: chargeFlag
      ? z
          .string({ error: '이름을 입력해주세요' })
          .trim()
          .min(2, { message: '2자 이상 입력해주세요' })
          .regex(NAME_REGEX, '한글, 영문, 띄어쓰기만')
      : z.string().optional(),
    emergencyPhone: z
      .union([
        z
          .string()
          .trim()
          .regex(PHONE_REGEX, '휴대폰 번호 형식으로 - 없이 입력해주세요')
          .max(13, '숫자만 입력해주세요'),
        z.literal(''),
        z.null(),
      ])
      .optional(),
    memo: z.string().optional(),
  })
}

export type MovingHouseFormValues = z.infer<ReturnType<typeof createMovingHouseFormSchema>>
