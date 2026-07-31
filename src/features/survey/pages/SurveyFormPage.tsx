import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useLocation, useNavigate, useParams } from 'react-router-dom'

import { SurveyFormQuestion } from '@/features/survey/components/form/SurveyFormQuestion'
import {
  usePostSurveyForm,
  useSurveyCertNavigation,
  useSurveyForm as useSurveyFormQuery,
} from '@/features/survey/queries/useSurvey'
import { createSurveyFormSchema, type SurveyFormValues } from '@/features/survey/schemas/survey'
import { SURVEY_QUESTION_TYPE, type SurveyFormQuestionData } from '@/features/survey/types/survey'
import { ButtonBase } from '@/shared/components/common/ButtonBase'
import { ModalButton } from '@/shared/components/common/ModalButton'
import { SpinnerCircle } from '@/shared/components/common/SpinnerCircle'
import { SpinnerDots } from '@/shared/components/common/SpinnerDots'
import { TextError } from '@/shared/components/common/TextError'
import { AppBar } from '@/shared/components/layouts/AppBar'
import { ACCESS_DENIED_MODAL_DATA } from '@/shared/constants/message'
import { ROUTE_PATH } from '@/shared/constants/routes'
import { useAuthStore } from '@/shared/stores/authStore'

/**
 * 설문 참여 (SV3). 레거시 `Form/SurveyFormView.vue` + 하위 4개 이식.
 *
 * **투표 참여 폼과 셋이 다르다**: 서술형 질문이 있고, 질문마다 필수/선택이 갈리고,
 * **서명이 없다**(버튼을 누르면 바로 제출).
 *
 * ⚠️ **비필수인데 답하지 않은 질문은 제출에서 빠진다.** 필수 질문은 값이 없어도
 * 포함되지만 그 전에 검증이 막는다.
 *
 * ⚠️ **화면이 자기 AppBar를 그린다** — 메인 앱 라우트도 AppBar를 켜서 **두 개가 겹친다.**
 * 투표(VT3)와 완전히 같은 문제다 (`survey.md` SV-Q1 · 실기기 확인 대상).
 *
 * ⚠️ **`TextError`를 안내 문구로 쓴다** — 에러가 아닌데 빨간 글씨다. 필수 표시 `*`와
 * 색을 맞춘 의도로 보인다. 그대로 옮겼다.
 *
 * 🔴 **질문별 에러 조회가 접두사 매칭이라 11번째 이후 질문의 에러가 앞 질문에 붙을 수
 * 있었다**(`questionList[1]`이 `questionList[10]`의 접두사다). 타깃은 RHF의 **중첩 에러
 * 객체**를 인덱스로 직접 읽어 이 문제가 구조적으로 사라졌다 (`survey.md` §4, SV-Q6).
 */

type SurveyAnswer = SurveyFormValues['questionList'][number]

/** 질문 유형에 맞는 빈 답변을 만든다. **서버는 `type`, 폼은 `questionType`이다** */
const createInitialAnswer = (question: SurveyFormQuestionData) => {
  if (question.type === SURVEY_QUESTION_TYPE.SUBJECTIVE) {
    return {
      questionType: SURVEY_QUESTION_TYPE.SUBJECTIVE,
      questionUuid: question.uuid,
      requiredFlag: question.requiredFlag,
      subjectiveAnswer: undefined,
    }
  }

  return {
    questionType:
      question.type === SURVEY_QUESTION_TYPE.MULTIPLE_CHOICE
        ? SURVEY_QUESTION_TYPE.MULTIPLE_CHOICE
        : SURVEY_QUESTION_TYPE.SINGLE_CHOICE,
    questionUuid: question.uuid,
    requiredFlag: question.requiredFlag,
    optionList: undefined,
    etcFlag: undefined,
    etcContent: undefined,
  }
}

/** 선택형이면 고른 uuid(들), 서술형이면 답변 문자열 */
const getAnswerValue = (answer: SurveyAnswer | undefined) => {
  if (!answer) return undefined
  if (answer.questionType === SURVEY_QUESTION_TYPE.SUBJECTIVE) return answer.subjectiveAnswer

  return answer.optionList
}

/** 기타 입력. 서술형 질문에는 없다 */
const getEtcContent = (answer: SurveyAnswer | undefined) => {
  if (!answer || answer.questionType === SURVEY_QUESTION_TYPE.SUBJECTIVE) return undefined

  return answer.etcContent
}

/** 답변이 하나라도 있는지. 제출에서 제외할지 판단한다 */
const hasAnswer = (answer: SurveyAnswer) => {
  if (answer.questionType === SURVEY_QUESTION_TYPE.SUBJECTIVE) {
    return Boolean((answer.subjectiveAnswer ?? '').trim())
  }
  if (Array.isArray(answer.optionList)) return answer.optionList.length > 0

  return Boolean(answer.optionList)
}

export const SurveyFormPage = () => {
  const navigate = useNavigate()
  const { participantUuid = '' } = useParams()
  const { state } = useLocation() as { state: { auth?: boolean } | null }

  const isLoggedIn = useAuthStore((store) => {
    return Boolean(store.aptInfo.aptResidentUuid)
  })

  const [isForbiddenOpen, setIsForbiddenOpen] = useState(!state?.auth)

  const { goToDetail } = useSurveyCertNavigation()
  const { surveyFormData, isSurveyFormLoading } = useSurveyFormQuery({ participantUuid })
  const { postSurveyFormMutation, isPostSurveyFormPending } = usePostSurveyForm({ participantUuid })

  const questionList = surveyFormData ?? []

  const {
    watch,
    setValue,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SurveyFormValues>({
    resolver: zodResolver(createSurveyFormSchema(questionList)),
    defaultValues: { questionList: [] },
  })

  useEffect(() => {
    if (!surveyFormData) return

    reset({
      questionList: surveyFormData.map(createInitialAnswer),
    } as SurveyFormValues)
  }, [surveyFormData, reset])

  const values = watch('questionList')

  const questionRefs = useRef<(HTMLLIElement | null)[]>([])

  const scrollToFirstError = () => {
    const firstErrorIndex = questionList.findIndex((_, index) => {
      return Boolean(errors.questionList?.[index])
    })
    if (firstErrorIndex < 0) return

    questionRefs.current[firstErrorIndex]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  const submit = handleSubmit(
    (formValues) => {
      // 비필수 + 미응답 질문은 서버에 보내지 않는다
      const answered = formValues.questionList.filter((answer) => {
        return answer.requiredFlag || hasAnswer(answer)
      })

      postSurveyFormMutation({
        answerList: answered.map((answer) => {
          if (answer.questionType === SURVEY_QUESTION_TYPE.SUBJECTIVE) {
            return {
              questionUuid: answer.questionUuid,
              subjectiveAnswer: answer.subjectiveAnswer ?? '',
            }
          }

          const serverQuestion = questionList.find((question) => {
            return question.uuid === answer.questionUuid
          })
          const optionUuids = Array.isArray(answer.optionList)
            ? answer.optionList
            : [answer.optionList].filter((uuid): uuid is string => {
                return Boolean(uuid)
              })

          return {
            questionUuid: answer.questionUuid,
            optionList: optionUuids.map((uuid) => {
              const serverOption = serverQuestion?.optionList?.find((option) => {
                return option.uuid === uuid
              })

              // 기타 옵션에만 답변 문자열을 함께 싣는다
              return serverOption?.type === SURVEY_QUESTION_TYPE.SUBJECTIVE && answer.etcContent
                ? { uuid, subjectiveAnswer: answer.etcContent }
                : { uuid }
            }),
          }
        }),
      })
    },
    () => {
      requestAnimationFrame(scrollToFirstError)
    },
  )

  const closeForbidden = () => {
    setIsForbiddenOpen(false)
    void navigate(isLoggedIn ? ROUTE_PATH.MAIN : ROUTE_PATH.HOME)
  }

  /** 질문 하나의 에러 문구. 어느 필드에 붙었든 그 질문 아래에 하나만 보여준다 */
  const getQuestionError = (index: number) => {
    // 유니온이라 필드별로 좁히기 어렵다. 어느 필드에 붙었든 문구 하나만 뽑는다
    const questionError = errors.questionList?.[index] as
      Record<string, { message?: string } | undefined> | undefined
    if (!questionError) return undefined

    return (
      questionError.optionList?.message ??
      questionError.etcContent?.message ??
      questionError.subjectiveAnswer?.message
    )
  }

  return (
    <div className="h-full">
      <AppBar className="bg-base-b-white" title="설문조사 참여" onBack={goToDetail} />

      {isSurveyFormLoading ? (
        <SpinnerDots />
      ) : (
        <form className="h-full overflow-auto p-5 pb-20" onSubmit={submit}>
          {/* ⚠️ 에러가 아니라 안내다. 레거시가 `TextError`를 그대로 썼다 */}
          <TextError className="mb-6">* 표시는 필수 질문임</TextError>

          <ol className="space-y-6">
            {questionList.map((question, questionIndex) => {
              const answer = values?.[questionIndex]

              return (
                <SurveyFormQuestion
                  key={question.uuid}
                  question={question}
                  questionIndex={questionIndex}
                  value={getAnswerValue(answer)}
                  etcContent={getEtcContent(answer)}
                  error={getQuestionError(questionIndex)}
                  isDisabled={isPostSurveyFormPending}
                  scrollRef={(element) => {
                    questionRefs.current[questionIndex] = element
                  }}
                  onSelect={(next) => {
                    setValue(
                      `questionList.${questionIndex}.optionList` as `questionList.${number}.optionList`,
                      next,
                      { shouldValidate: true },
                    )

                    // 기타 옵션을 골랐는지를 스키마가 이 값으로 판단한다
                    const etcOption = question.optionList?.find((option) => {
                      return option.type === SURVEY_QUESTION_TYPE.SUBJECTIVE
                    })
                    if (!etcOption) return

                    const isEtcSelected = Array.isArray(next)
                      ? next.includes(etcOption.uuid)
                      : next === etcOption.uuid
                    // 유니온 필드라 경로 타입이 좁혀지지 않는다. 값 자체는 boolean이다
                    setValue(
                      `questionList.${questionIndex}.etcFlag` as `questionList.${number}.etcFlag`,
                      isEtcSelected,
                    )
                  }}
                  onSubjectiveChange={(next) => {
                    setValue(
                      `questionList.${questionIndex}.subjectiveAnswer` as `questionList.${number}.subjectiveAnswer`,
                      next,
                      { shouldValidate: true },
                    )
                  }}
                  onEtcContentChange={(next) => {
                    setValue(
                      `questionList.${questionIndex}.etcContent` as `questionList.${number}.etcContent`,
                      next,
                      { shouldValidate: true },
                    )
                  }}
                />
              )
            })}
          </ol>

          <ButtonBase
            type="submit"
            color="brand"
            roundType="square"
            size="2xl"
            className="fixed bottom-0 left-0 flex justify-center"
            disabled={isPostSurveyFormPending}
          >
            {isPostSurveyFormPending ? <SpinnerCircle /> : '제출하기'}
          </ButtonBase>
        </form>
      )}

      <ModalButton
        open={isForbiddenOpen}
        onClose={closeForbidden}
        buttonType="single"
        modalData={ACCESS_DENIED_MODAL_DATA}
        onFirstClick={closeForbidden}
      />
    </div>
  )
}
