import { z } from 'zod'

import { SURVEY_QUESTION_TYPE, type SurveyFormQuestionData } from '@/features/survey/types/survey'
import { NAME_REGEX, PHONE_REGEX } from '@/shared/constants/regex'

/**
 * 설문 이름·휴대폰 본인인증 (SV6). 투표의 같은 스키마와 내용이 동일하다.
 */
export const surveyAuthNamePhoneSchema = z.object({
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

export type SurveyAuthNamePhoneForm = z.infer<typeof surveyAuthNamePhoneSchema>

/** 서술형 답변 1개 */
const subjectiveQuestion = z.object({
  questionType: z.literal(SURVEY_QUESTION_TYPE.SUBJECTIVE),
  questionUuid: z.string(),
  requiredFlag: z.boolean().optional(),
  subjectiveAnswer: z.string().optional(),
})

/** 선택형 답변 1개. 기타 옵션 때문에 필드가 둘 더 있다 */
const choiceShape = {
  questionUuid: z.string(),
  requiredFlag: z.boolean().optional(),
  optionList: z.union([z.string(), z.array(z.string())]).optional(),
  /** 기타 옵션을 골랐는지 */
  etcFlag: z.boolean().optional(),
  etcContent: z.string().optional(),
}

/**
 * 참여 폼 (SV3). **질문 유형 3종을 `discriminatedUnion`으로 가른다** — 투표는 유형이 2종뿐이고
 * 필드도 같아서 단일 객체로 충분했다.
 *
 * 검증 순서가 곧 명세다. 질문마다 위에서부터 실행되고 **서버 질문을 못 찾으면 통째로 건너뛴다.**
 *
 * | 순서 | 조건                                        | 문구                                 |
 * | ---- | ------------------------------------------- | ------------------------------------ |
 * | 0    | 기타 옵션 선택 + 기타 입력 비어 있음        | `기타 답변을 입력해주세요`           |
 * | 1    | 서술형 + 필수 + 답변 공백                   | `답변을 입력해주세요`                |
 * | 2    | 복수 + **비필수 + 미선택** → **검증 통과**  | —                                    |
 * | 3    | 복수 + 필수 미선택 / 최소 미달              | `최소 {min}개를 선택해주세요`        |
 * | 4    | 복수 + 최대 초과                            | `최대 {max}개까지만 선택 가능합니다` |
 * | 5    | 단일 + 필수 + 미선택                        | `옵션을 선택해주세요`                |
 *
 * ⚠️ **선택을 했다면 필수/비필수와 무관하게 min·max를 검증한다** (레거시 주석에 명시).
 *
 * 🔴 **`min`·`max` 기본값이 `0`이다.** 서버가 안 주면 하나만 골라도
 * `최대 0개까지만 선택 가능합니다`가 뜬다 (SV-Q4). 레거시 그대로다.
 *
 * ⚠️ **`selectedCount`가 단일 선택에서는 글자 수다** — `optionList`가 문자열이라
 * `.length`가 uuid 길이가 된다. 단일 선택은 `> 0` 여부만 보므로 무해하지만 의미상 틀렸다.
 */
export const createSurveyFormSchema = (serverQuestionList: SurveyFormQuestionData[]) => {
  return z
    .object({
      questionList: z.array(
        z.discriminatedUnion('questionType', [
          subjectiveQuestion,
          z.object({
            questionType: z.literal(SURVEY_QUESTION_TYPE.SINGLE_CHOICE),
            ...choiceShape,
          }),
          z.object({
            questionType: z.literal(SURVEY_QUESTION_TYPE.MULTIPLE_CHOICE),
            ...choiceShape,
          }),
        ]),
      ),
    })
    .superRefine(({ questionList }, context) => {
      questionList.forEach((question, index) => {
        const serverQuestion = serverQuestionList.find((item) => {
          return item.uuid === question.questionUuid
        })
        if (!serverQuestion) return

        const isRequired = Boolean(serverQuestion.requiredFlag)
        const isSubjective = question.questionType === SURVEY_QUESTION_TYPE.SUBJECTIVE

        if (isSubjective) {
          if (!isRequired) return
          if ((question.subjectiveAnswer ?? '').trim()) return

          context.addIssue({
            code: 'custom',
            message: '답변을 입력해주세요',
            path: ['questionList', index, 'subjectiveAnswer'],
          })
          return
        }

        const selectedCount = question.optionList?.length ?? 0

        // 0. 기타 옵션을 골랐는데 입력이 비어 있으면 먼저 막는다
        if (serverQuestion.etcFlag && question.etcFlag) {
          const etcOption = serverQuestion.optionList?.find((option) => {
            return option.type === SURVEY_QUESTION_TYPE.SUBJECTIVE
          })

          const isEtcSelected =
            etcOption &&
            (Array.isArray(question.optionList)
              ? question.optionList.includes(etcOption.uuid)
              : question.optionList === etcOption.uuid)

          if (isEtcSelected && !(question.etcContent ?? '').trim()) {
            context.addIssue({
              code: 'custom',
              message: '기타 답변을 입력해주세요',
              path: ['questionList', index, 'etcContent'],
            })
            return
          }
        }

        if (question.questionType === SURVEY_QUESTION_TYPE.MULTIPLE_CHOICE) {
          const min = serverQuestion.minChoice || 0
          const max = serverQuestion.maxChoice || 0

          // 비필수인데 아무것도 안 골랐으면 통과시킨다
          if (!isRequired && selectedCount === 0) return

          if (selectedCount < min) {
            context.addIssue({
              code: 'custom',
              message: `최소 ${min}개를 선택해주세요`,
              path: ['questionList', index, 'optionList'],
            })
            return
          }
          if (selectedCount > max) {
            context.addIssue({
              code: 'custom',
              message: `최대 ${max}개까지만 선택 가능합니다`,
              path: ['questionList', index, 'optionList'],
            })
          }
          return
        }

        if (!isRequired) return
        if (selectedCount > 0) return

        context.addIssue({
          code: 'custom',
          message: '옵션을 선택해주세요',
          path: ['questionList', index, 'optionList'],
        })
      })
    })
}

export type SurveyFormValues = z.infer<ReturnType<typeof createSurveyFormSchema>>
