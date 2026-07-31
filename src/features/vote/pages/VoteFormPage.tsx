import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useLocation, useNavigate, useParams } from 'react-router-dom'

import { VoteFormQuestion } from '@/features/vote/components/form/VoteFormQuestion'
import { VoteFormSignModal } from '@/features/vote/components/form/VoteFormSignModal'
import {
  usePostVoteForm,
  useVoteCertNavigation,
  useVoteForm as useVoteFormQuery,
} from '@/features/vote/queries/useVote'
import { createVoteFormSchema, type VoteFormValues } from '@/features/vote/schemas/vote'
import { ButtonBase } from '@/shared/components/common/ButtonBase'
import { ModalButton } from '@/shared/components/common/ModalButton'
import { SpinnerCircle } from '@/shared/components/common/SpinnerCircle'
import { SpinnerDots } from '@/shared/components/common/SpinnerDots'
import { AppBar } from '@/shared/components/layouts/AppBar'
import { ACCESS_DENIED_MODAL_DATA } from '@/shared/constants/message'
import { ROUTE_PATH } from '@/shared/constants/routes'
import { useAuthStore } from '@/shared/stores/authStore'

/**
 * 전자투표 참여 (VT3). 레거시 `Form/VoteFormView.vue` + 하위 4개 이식.
 *
 * **질문마다 라디오(단일) 또는 체크박스(복수)로 고르고, 서명을 그려야 제출된다.**
 * 검증 규칙이 질문마다 달라(최소·최대 선택 수) 스키마를 **서버 응답으로 만든다.**
 *
 * ⚠️ **화면이 자기 AppBar를 그린다.** 메인 앱 라우트는 `showAppBar: true`라 **두 개가
 * 정확히 겹친다**(둘 다 `fixed top-0 z-[100]`, 제목도 같다). 뒤로가기 동작만 다르다 —
 * 화면 것은 상세로, 라우트 것은 목록으로 간다 (`vote.md` VT-Q1 · 실기기 확인 대상).
 * 등가 이관이라 그대로 두되, 라우트 쪽 AppBar를 끄면 화면이 달라지므로 손대지 않았다.
 *
 * ⚠️ **직접 URL로 들어오면 접근 금지 모달을 띄운다.** 닫으면 로그인 상태면 `/main`,
 * 아니면 `/`로 간다 — VT4·VT6과 또 다른 목적지다 (`vote.md` §6-4).
 *
 * ⚠️ 레거시의 `provide`/`inject` 2단 컨텍스트를 **props로 바꿨다.** 트리가 3단뿐이고
 * 그 컨텍스트는 반응형도 아니었다(`vote.md` §3).
 */
export const VoteFormPage = () => {
  const navigate = useNavigate()
  const { voterUuid = '' } = useParams()
  const { state } = useLocation() as { state: { auth?: boolean } | null }

  const isLoggedIn = useAuthStore((store) => {
    return Boolean(store.aptInfo.aptResidentUuid)
  })

  const [isForbiddenOpen, setIsForbiddenOpen] = useState(!state?.auth)
  const [isSignOpen, setIsSignOpen] = useState(false)

  const { goToDetail } = useVoteCertNavigation()
  const { voteFormData, isVoteFormLoading } = useVoteFormQuery({ voterUuid })
  const { postVoteFormMutation, isPostVoteFormPending } = usePostVoteForm({ voterUuid })

  const questionList = voteFormData?.questionList ?? []

  const {
    watch,
    setValue,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<VoteFormValues>({
    resolver: zodResolver(createVoteFormSchema(questionList)),
    defaultValues: { questionList: [] },
  })

  // 서버 데이터가 오면 질문 수만큼 빈 칸을 만든다 (레거시 `watch(voteDetailForm, immediate)`)
  useEffect(() => {
    if (!voteFormData?.questionList) return

    reset({
      questionList: voteFormData.questionList.map((question) => {
        return {
          questionUuid: question.uuid,
          questionType: question.questionType ?? '',
          // 미선택 상태다. 검증이 여기서 `옵션을 선택해주세요`를 낸다
          optionList: undefined as unknown as string,
        }
      }),
    })
  }, [voteFormData, reset])

  const values = watch('questionList')

  /** 검증 실패 시 첫 에러 질문으로 스크롤한다. 레거시 `focusFirstError`의 대체물 */
  const questionRefs = useRef<(HTMLLIElement | null)[]>([])

  const scrollToFirstError = () => {
    const firstErrorIndex = questionList.findIndex((_, index) => {
      return Boolean(errors.questionList?.[index])
    })
    if (firstErrorIndex < 0) return

    questionRefs.current[firstErrorIndex]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  const openSignModal = handleSubmit(
    () => {
      setIsSignOpen(true)
    },
    () => {
      // 렌더가 에러를 반영한 다음에 스크롤해야 위치가 맞는다
      requestAnimationFrame(scrollToFirstError)
    },
  )

  const closeForbidden = () => {
    setIsForbiddenOpen(false)
    void navigate(isLoggedIn ? ROUTE_PATH.MAIN : ROUTE_PATH.HOME)
  }

  return (
    <div className="h-full">
      <AppBar className="bg-base-b-white" title="전자투표 참여" onBack={goToDetail} />

      {isVoteFormLoading ? (
        <SpinnerDots />
      ) : (
        <div className="h-full overflow-auto p-5 pb-20">
          <ol className="space-y-6">
            {questionList.map((question, questionIndex) => {
              return (
                <VoteFormQuestion
                  key={question.uuid}
                  question={question}
                  questionIndex={questionIndex}
                  voteType={voteFormData?.voteType}
                  selected={values?.[questionIndex]?.optionList}
                  error={errors.questionList?.[questionIndex]?.optionList?.message}
                  scrollRef={(element) => {
                    questionRefs.current[questionIndex] = element
                  }}
                  onSelect={(next) => {
                    setValue(
                      `questionList.${questionIndex}.optionList`,
                      next as VoteFormValues['questionList'][number]['optionList'],
                      { shouldValidate: true },
                    )
                  }}
                />
              )
            })}
          </ol>

          <ButtonBase
            type="button"
            color="brand"
            roundType="square"
            size="2xl"
            className="fixed bottom-0 left-0 flex justify-center"
            disabled={isPostVoteFormPending}
            onClick={() => {
              void openSignModal()
            }}
          >
            {isPostVoteFormPending ? <SpinnerCircle /> : '서명하고 투표제출'}
          </ButtonBase>
        </div>
      )}

      {isSignOpen && (
        <VoteFormSignModal
          isPending={isPostVoteFormPending}
          onClose={() => {
            setIsSignOpen(false)
          }}
          onSave={({ file }) => {
            postVoteFormMutation({
              // 단일 선택도 배열로 감싸 보낸다 — 서버는 언제나 배열을 기대한다
              questionList: (values ?? []).map((question) => {
                return {
                  questionUuid: question.questionUuid,
                  questionType: question.questionType,
                  optionList: Array.isArray(question.optionList)
                    ? question.optionList
                    : [question.optionList],
                }
              }),
              signFile: file,
            })
          }}
        />
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
