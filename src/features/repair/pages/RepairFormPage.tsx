import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router-dom'

import { RepairFormFields } from '@/features/repair/components/RepairFormFields'
import { RepairFormImage } from '@/features/repair/components/RepairFormImage'
import {
  REPAIR_EDIT_BACK_MODAL_DATA,
  REPAIR_FORM_TITLE,
  REPAIR_IMAGE_MESSAGE,
  REPAIR_WRITE_BACK_MODAL_DATA,
} from '@/features/repair/constants/repair'
import { useRepairImageList } from '@/features/repair/hooks/useRepairImageList'
import {
  type RepairSubmitPayload,
  usePatchRepairSubmission,
  usePostRepairSubmission,
  useRepairDetail,
} from '@/features/repair/queries/useRepair'
import { repairFormSchema, type RepairFormValues } from '@/features/repair/schemas/repair'
import { ModalButton } from '@/shared/components/common/ModalButton'
import { SpinnerCircle } from '@/shared/components/common/SpinnerCircle'
import { SpinnerDots } from '@/shared/components/common/SpinnerDots'
import { AppBar } from '@/shared/components/layouts/AppBar'
import { showToast } from '@/shared/lib/toast'
import { useAuthStore } from '@/shared/stores/authStore'
import { formatHtmlText } from '@/shared/utils/formatHtmlText'
import { formatPhone } from '@/shared/utils/formatPhone'

/**
 * 접수 등록·수정 (RP2·RP3). 레거시 `RepairFormContainer` + `WriteView` + `EditView` 이식.
 *
 * **두 화면이 한 컴포넌트다.** 다른 것은 제출 대상과 초기값뿐이다.
 *
 * ✅ **레거시의 경로 판정 버그를 고쳤다** (RP-Q1). `isWritingPage`가 `'write'`를 찾는데
 * 실제 라우트는 `/repair/create`라 **두 화면 모두 `false`**였고, 그래서 등록 화면에서도
 * 제목이 `하자보수 수정`, 뒤로가기 모달이 `수정 그만두기`로 떴다. 이제 등록은
 * **`하자보수 등록`**(사용자 결정 문구)과 `작성 그만두기`를 쓴다.
 *
 * ✅ **AppBar 중첩을 없앴다** (RP-Q2). 레거시 RP2는 라우트 meta와 화면이 각각 AppBar를
 * 그려 **두 개가 정확히 겹쳤다.** 라우트 쪽을 끄고 화면 것만 남겼다 — 제출 버튼과
 * 뒤로가기 모달이 화면 AppBar에 붙어 있어 그쪽이 기능적으로 옳다.
 *
 * ✅ **상단 `pt-12`를 붙였다** (RP-Q3). 레거시 RP3는 콘텐츠 위 48px가 AppBar에 덮여
 * `동`·`호수` 라벨이 가려졌다. RP2는 레이아웃이 밀어줘서 우연히 정상이었는데, 위에서
 * 레이아웃 AppBar를 껐으므로 **이제 두 화면 다 화면이 직접 밀어준다.**
 *
 * ⚠️ **폼이 화면과 함께 사라진다.** 레거시는 Pinia 스토어 안에 폼이 있어 전역 싱글턴이었고,
 * 하드웨어 뒤로가기로 나가면 **다음 진입 시 이전 초안이 남았다** (`repair.md` RP-Q5).
 * RHF로 옮기면서 그 동작이 없어졌다 — 등가 이탈이지만 버그로 보이는 쪽이라 되살리지 않았다.
 *
 * ⚠️ **제출 버튼이 AppBar 우측에 있다.** 하단 고정 버튼이 아니다 — 이 도메인 고유 패턴이고
 * `form` 속성으로 폼 밖에서 제출한다. **검증 실패 상태에서도 누를 수 있다**(색만 회색).
 */
export const RepairFormPage = ({ mode }: { mode: 'create' | 'edit' }) => {
  const navigate = useNavigate()
  const { repairUuid = '' } = useParams()
  const isEdit = mode === 'edit'

  const aptInfo = useAuthStore((state) => {
    return state.aptInfo
  })

  const [isBackModalOpen, setIsBackModalOpen] = useState(false)

  const { repairDetail, isRepairDetailLoading } = useRepairDetail({
    repairUuid: isEdit ? repairUuid : '',
  })

  const { postRepairSubmissionMutation, isPostRepairSubmissionPending, progressPercent } =
    usePostRepairSubmission()
  const {
    patchRepairSubmissionMutation,
    isPatchRepairSubmissionPending,
    progressPercent: editProgressPercent,
  } = usePatchRepairSubmission({ repairUuid })

  const { imageList, setImageList, previewImageList, addImages, removeImage } = useRepairImageList()

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RepairFormValues>({
    resolver: zodResolver(repairFormSchema),
    mode: 'onChange',
    defaultValues: { location: '', content: '', emergencyPhone: '', requirement: '' },
  })

  // 수정 화면은 상세가 도착하면 값을 채운다.
  // ⚠️ **`<br/>` ↔ 개행 왕복을 그대로 옮겼다** — 서버가 `<br/>`로 저장한 것도 개행으로
  // 되돌려 textarea에 넣는다. 단순화하면 줄바꿈이 달라진다
  useEffect(() => {
    if (!isEdit || !repairDetail) return

    reset({
      emergencyPhone: formatPhone({ phone: repairDetail.emergencyPhone ?? '' }),
      location: formatHtmlText({ text: repairDetail.location ?? '' }),
      content: formatHtmlText({ text: repairDetail.content ?? '' }).replaceAll('<br/>', '\n'),
      requirement: formatHtmlText({ text: repairDetail.requirement ?? '' }).replaceAll(
        '<br/>',
        '\n',
      ),
    })
    setImageList(repairDetail.fileList ?? [])
  }, [isEdit, repairDetail, reset, setImageList])

  const isSubmitting = isPostRepairSubmissionPending || isPatchRepairSubmissionPending
  const hasError = Object.keys(errors).length > 0

  const submit = handleSubmit((values) => {
    const payload: RepairSubmitPayload = {
      location: values.location || null,
      content: values.content || null,
      fileList: imageList.map((image) => {
        return image instanceof File ? image : { fileUuid: image.fileUuid }
      }),
    }

    // 값이 있을 때만 키를 만든다 — 빈 값을 보내면 서버가 덮어쓴다
    if (values.emergencyPhone) payload.emergencyPhone = values.emergencyPhone.replaceAll('-', '')
    if (values.requirement) payload.requirement = values.requirement

    if (isEdit) {
      patchRepairSubmissionMutation(payload)
      return
    }
    postRepairSubmissionMutation(payload)
  })

  const isLoading = isEdit && isRepairDetailLoading

  return (
    <div className="h-full">
      <AppBar
        className="bg-base-b-white"
        title={isEdit ? REPAIR_FORM_TITLE.edit : REPAIR_FORM_TITLE.create}
        onBack={() => {
          setIsBackModalOpen(true)
        }}
      >
        <button
          type="submit"
          form="repairForm"
          disabled={isSubmitting}
          className={
            hasError ? 'text-defaults-secondary-text-secondary' : 'text-brand-default-text-brand'
          }
        >
          {isSubmitting ? <SpinnerCircle color="black" /> : <span>완료</span>}
        </button>
      </AppBar>

      {isLoading || isSubmitting ? (
        <SpinnerDots progressPercent={isEdit ? editProgressPercent : progressPercent} />
      ) : (
        // ✅ AppBar 높이만큼 밀어준다 (RP-Q3)
        <form
          id="repairForm"
          className="h-full w-full space-y-6 overflow-auto p-5 pt-12"
          onSubmit={submit}
        >
          <RepairFormFields
            control={control}
            errors={errors}
            dong={aptInfo.dong ?? ''}
            ho={aptInfo.ho ?? ''}
            phone={formatPhone({ phone: String(aptInfo.residentId ?? '') })}
          />
          <RepairFormImage
            previewImageList={previewImageList}
            onAdd={(event) => {
              addImages({
                event,
                onError: (errorType) => {
                  showToast({ message: REPAIR_IMAGE_MESSAGE[errorType] })
                },
              })
            }}
            onRemove={removeImage}
          />
        </form>
      )}

      <ModalButton
        open={isBackModalOpen}
        onClose={() => {
          setIsBackModalOpen(false)
        }}
        buttonType="dual"
        modalData={isEdit ? REPAIR_EDIT_BACK_MODAL_DATA : REPAIR_WRITE_BACK_MODAL_DATA}
        onFirstClick={() => {
          setIsBackModalOpen(false)
        }}
        onSecondClick={() => {
          setIsBackModalOpen(false)
          void navigate(-1)
        }}
      />
    </div>
  )
}
