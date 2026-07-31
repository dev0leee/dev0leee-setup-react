import { z } from 'zod'

import { QUESTION_TYPE, type VoteFormQuestionData } from '@/features/vote/types/vote'
import { NAME_REGEX, PHONE_REGEX } from '@/shared/constants/regex'

/**
 * 투표 이름·휴대폰 본인인증 (VT6). 레거시 `schemas/vote.js`의 `voteAuthNamePhoneSchema`.
 *
 * 레거시가 공용 `name`·`phone` 필드를 조합한 것을 그대로 옮겼다 — 문구까지 동일하다.
 *
 * ⚠️ **`PHONE_REGEX`는 하이픈이 있는 형태를 요구한다.** placeholder는 "- 없이"라고
 * 하지만 `InputBase type="tel"`이 입력하는 동안 하이픈을 넣어준다. 로그인 폼과 같은
 * 구조다(`features/auth/schemas/login.ts`).
 *
 * ⚠️ **`dong`·`ho`는 스키마에 없다.** 화면이 표시만 하고 제출에 싣지 않는다.
 */
export const voteAuthNamePhoneSchema = z.object({
  name: z
    .string({ error: '이름을 입력해주세요' })
    .trim()
    .min(2, { message: '2자 이상 입력해주세요' })
    .regex(NAME_REGEX, '한글, 영문, 띄어쓰기만'),
  phone: z
    .string({ error: '휴대폰을 입력해주세요' })
    .trim()
    .regex(PHONE_REGEX, '휴대폰 번호 형식으로 - 없이 입력해주세요')
    .max(13, '숫자만 입력해주세요'),
})

export type VoteAuthNamePhoneForm = z.infer<typeof voteAuthNamePhoneSchema>

/**
 * 참여 폼 (VT3). **서버가 준 질문 목록을 받아 스키마를 만든다** — 질문마다 최소/최대
 * 선택 수가 달라서 정적으로 쓸 수 없다. 레거시 `voteFormSchema(questionList)` 그대로다.
 *
 * | 상황                | 문구                                       |
 * | ------------------- | ------------------------------------------ |
 * | 미선택(단일·복수)   | `옵션을 선택해주세요`                      |
 * | 복수 최소 미달      | `최소 {minChoice}개를 선택해주세요`        |
 * | 복수 최대 초과      | `최대 {maxChoice}개까지만 선택 가능합니다` |
 *
 * ⚠️ **단일 선택에는 `superRefine` 검증이 없다.** 값이 없으면 `z.string()`이 거부해
 * 같은 문구가 나온다 — 의도대로 동작한다.
 *
 * ⚠️ **`minChoice`/`maxChoice`가 없는 질문은 검증을 건너뛴다** (레거시 `&& questionData`).
 */
export const createVoteFormSchema = (questionList: VoteFormQuestionData[]) => {
  return z
    .object({
      questionList: z.array(
        z.object({
          questionType: z.string(),
          questionUuid: z.string(),
          optionList: z.union([z.string({ error: '옵션을 선택해주세요' }), z.array(z.string())]),
        }),
      ),
    })
    .superRefine(({ questionList: formQuestionList }, context) => {
      formQuestionList.forEach((question, index) => {
        const optionsLength = Array.isArray(question.optionList) ? question.optionList.length : 1
        const questionData = questionList.find((item) => {
          return item.uuid === question.questionUuid
        })

        if (question.questionType !== QUESTION_TYPE.MULTIPLE_CHOICE || !questionData) return

        if (questionData.minChoice !== undefined && optionsLength < questionData.minChoice) {
          context.addIssue({
            code: 'custom',
            message: `최소 ${questionData.minChoice}개를 선택해주세요`,
            path: ['questionList', index, 'optionList'],
          })
        }
        if (questionData.maxChoice !== undefined && optionsLength > questionData.maxChoice) {
          context.addIssue({
            code: 'custom',
            message: `최대 ${questionData.maxChoice}개까지만 선택 가능합니다`,
            path: ['questionList', index, 'optionList'],
          })
        }
      })
    })
}

export type VoteFormValues = z.infer<ReturnType<typeof createVoteFormSchema>>
