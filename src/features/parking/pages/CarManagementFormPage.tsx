import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, type Resolver, useForm } from 'react-hook-form'
import { useLocation, useParams } from 'react-router-dom'

import { BookmarkCarSelectorButton } from '@/features/parking/components/BookmarkCarSelectorButton'
import { VisitPurposeSelect } from '@/features/parking/components/VisitPurposeSelect'
import {
  CAR_FORM_MAX_LENGTH,
  CAR_FORM_PLACEHOLDER,
  CAR_MANAGEMENT_TYPE,
  PARKING_WALL_PAD_ALARM_DESCRIPTION,
  PARKING_WALL_PAD_ALARM_INPUT,
} from '@/features/parking/constants/parking'
import { useCarManagementType } from '@/features/parking/hooks/useCarManagementType'
import { useWallPadContent } from '@/features/parking/hooks/useWallPadContent'
import { useVisitPurposeList } from '@/features/parking/queries/useCarLists'
import {
  usePatchBookmarkCar,
  usePostAlwaysAllowCar,
  usePostBookmarkCar,
} from '@/features/parking/queries/useCarMutations'
import {
  type AlwaysAllowCarForm,
  alwaysAllowCarSchema,
  alwaysAllowCarWithWallPadSchema,
  type BookmarkCarForm,
  bookmarkCarSchema,
  type CarManagementForm,
} from '@/features/parking/schemas/carManagement'
import type { BookmarkCar } from '@/features/parking/types/parking'
import { ButtonBase } from '@/shared/components/common/ButtonBase'
import { InputBase } from '@/shared/components/common/InputBase'
import { InputRadioDual } from '@/shared/components/common/InputRadioDual'
import { SpinnerCircle } from '@/shared/components/common/SpinnerCircle'
import { TextError } from '@/shared/components/common/TextError'
import { formatPhone } from '@/shared/utils/formatPhone'

/** 필수 표시 아이콘. 라벨 4개가 같은 것을 쓴다 */
const EssentialMark = () => {
  return <img src="/assets/icons/Essential.svg" alt="별표 아이콘" />
}

/**
 * 차량 등록·수정 (PK5·PK6·PK7). 레거시 `CarManagementForm.vue`(268 LOC) 이식.
 * `CarManagementAddView`·`CarManagementEditView`는 한 줄 래퍼라 옮기지 않았다.
 *
 * | 필드            | PK5 즐겨찾기 등록 | PK6 항상허용 등록 | PK7 즐겨찾기 수정 |
 * | --------------- | ----------------- | ----------------- | ----------------- |
 * | 차량번호        | ✅                | ✅                | ✅                |
 * | 불러오기 버튼   | ❌                | ✅                | ❌                |
 * | 별칭            | ✅                | ❌                | ✅                |
 * | 연락처          | ✅                | ✅                | ✅                |
 * | 방문 목적·메모  | ❌                | ✅                | ❌                |
 * | 월패드 알림     | ❌                | ✅ (구독 단지만)  | ❌                |
 *
 * **항상허용 수정은 없다** — 라우트도 API도 없다 (R-1). 만들지 않는다.
 *
 * 🔴 **수정 화면의 초기값을 라우터 state로만 받는다.** 목록의 `수정` 버튼이 카드 정보를
 * 통째로 넘긴다. **새로고침·딥링크로 들어오면 state가 없어 폼이 통째로 빈다** — 그대로
 * 저장하면 값이 지워진다. 게시글 신고(`board.md` §5-13)와 같은 유형의 구조적 결함이고,
 * 등가 이관이라 재현한다 (`parking.md` §PK5 · `deferred.md`).
 *
 * ⚠️ **제출 버튼은 검증에 실패해도 눌린다.** `disabled`는 제출 중일 때만이고, 색만
 * 회색·아웃라인으로 바뀐다. 누르면 필드 아래 **인라인 에러**가 뜬다 — 게시판이 모달인
 * 것과 다르다. 도메인 간 비대칭을 유지한다.
 *
 * ⚠️ 버튼 색 기준인 레거시 `meta.valid`는 **에러가 비어 있으면 참**이라 첫 진입에는
 * 브랜드 색이다. RHF `formState.isValid`는 반대로 false에서 시작하므로 쓰지 않고
 * **에러 개수**로 판정한다 (`mypage` 프로필 수정과 같은 방식).
 *
 * ⚠️ **연락처는 하이픈이 있는 상태로 검증하고 전송 직전에 뺀다.** `InputBase`가
 * `type="tel"`에서 자동으로 하이픈을 넣는다.
 */
export const CarManagementFormPage = () => {
  const location = useLocation()
  const { uuid: bookmarkUuid } = useParams()
  const { carManagementType } = useCarManagementType()
  const { hasWallPadUI } = useWallPadContent()

  const isAlwaysAllow = carManagementType.key === CAR_MANAGEMENT_TYPE.ALWAYS_ALLOW.key
  const isAddPage = location.pathname.includes('add')
  const hasWallPadField = hasWallPadUI && isAlwaysAllow

  const { visitPurposeList, isVisitPurposeLoading, isVisitPurposeError } = useVisitPurposeList()

  const { postBookmarkCarMutation, isPostBookmarkCarPending } = usePostBookmarkCar()
  const { postAlwaysAllowCarMutation, isPostAlwaysAllowCarPending } = usePostAlwaysAllowCar()
  const { patchBookmarkCarMutation, isPatchBookmarkCarPending } = usePatchBookmarkCar()

  // 🔴 state가 없으면(새로고침) 빈 폼이 된다 — 레거시와 같다
  const editCarInfo = (location.state as { carInfo?: BookmarkCar } | null)?.carInfo

  const schema = isAlwaysAllow
    ? hasWallPadUI
      ? alwaysAllowCarWithWallPadSchema
      : alwaysAllowCarSchema
    : bookmarkCarSchema

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CarManagementForm>({
    // 스키마가 화면마다 다른데 폼 값 타입은 하나다 — 합집합 타입으로 좁혀 넘긴다.
    // 검증을 통과한 값이 각 화면이 기대하는 모양임은 스키마가 보장한다.
    resolver: zodResolver(schema) as Resolver<CarManagementForm>,
    mode: 'onChange',
    // ⚠️ `memo`에 기본값을 주지 않는다. 빈 문자열을 넣으면 **메모 없이 등록해도
    // `memo: ""`가 서버에 간다** — 레거시는 값이 없으면 아예 보내지 않는다.
    defaultValues: {
      carNum: editCarInfo?.carNum ?? '',
      nickName: editCarInfo?.nickName ?? '',
      phone: formatPhone({ phone: editCarInfo?.phone ?? undefined }),
    },
  })

  // 레거시 `meta.valid` = "에러가 비어 있음". 첫 진입에는 참이다
  const hasNoError = Object.keys(errors).length === 0
  const isPending =
    isPostBookmarkCarPending || isPostAlwaysAllowCarPending || isPatchBookmarkCarPending

  const onSubmit = handleSubmit((formValues) => {
    if (!isAddPage) {
      patchBookmarkCarMutation({
        ...(formValues as BookmarkCarForm),
        bookmarkUuid: bookmarkUuid ?? '',
      })
      return
    }

    if (isAlwaysAllow) {
      postAlwaysAllowCarMutation(formValues as AlwaysAllowCarForm)
      return
    }

    postBookmarkCarMutation(formValues as BookmarkCarForm)
  })

  return (
    <form className="flex h-full w-full flex-col justify-between overflow-auto" onSubmit={onSubmit}>
      <ul className="w-full space-y-5 p-5 pb-20">
        <li className="flex flex-col items-start gap-[11px] self-stretch">
          <div className="flex w-full justify-between">
            <label
              htmlFor="carNum"
              className="flex items-center gap-1 px-1 py-0 pretendard-15SemiBold text-defaults-primary-text-primary"
            >
              <span>차량번호</span>
              <EssentialMark />
            </label>
            {isAlwaysAllow && (
              <BookmarkCarSelectorButton
                onSelectCard={(card) => {
                  // 차량번호와 연락처만 채운다
                  setValue('carNum', card.carNum ?? '', { shouldValidate: true })
                  setValue('phone', formatPhone({ phone: card.phone ?? undefined }), {
                    shouldValidate: true,
                  })
                }}
              />
            )}
          </div>
          <div className="w-full space-y-1.5">
            <Controller
              control={control}
              name="carNum"
              render={({ field }) => {
                return (
                  <InputBase
                    id="carNum"
                    value={field.value}
                    placeholder={CAR_FORM_PLACEHOLDER.carNum}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                  />
                )
              }}
            />
            <TextError>{errors.carNum?.message}</TextError>
          </div>
        </li>

        {!isAlwaysAllow && (
          <li className="flex flex-col items-start gap-[11px] self-stretch">
            <label
              htmlFor="nickName"
              className="flex items-center gap-1 px-1 py-0 pretendard-15SemiBold text-defaults-primary-text-primary"
            >
              <span>별칭</span>
              <EssentialMark />
            </label>
            <div className="flex w-full flex-col items-start gap-[6px]">
              <Controller
                control={control}
                name="nickName"
                render={({ field }) => {
                  return (
                    <InputBase
                      id="nickName"
                      value={field.value}
                      maxLength={CAR_FORM_MAX_LENGTH.nickName}
                      placeholder={CAR_FORM_PLACEHOLDER.nickName}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                    />
                  )
                }}
              />
              <TextError>{errors.nickName?.message}</TextError>
            </div>
          </li>
        )}

        <li className="flex flex-col items-start gap-[11px] self-stretch">
          <label
            htmlFor="phone"
            className="flex items-center gap-1 px-1 py-0 pretendard-15SemiBold text-defaults-primary-text-primary"
          >
            <span>연락처</span>
            <EssentialMark />
          </label>
          <div className="flex w-full flex-col items-start gap-[6px]">
            <Controller
              control={control}
              name="phone"
              render={({ field }) => {
                return (
                  <InputBase
                    id="phone"
                    type="tel"
                    value={field.value}
                    maxLength={CAR_FORM_MAX_LENGTH.phone}
                    placeholder={CAR_FORM_PLACEHOLDER.phone}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                  />
                )
              }}
            />
            <TextError>{errors.phone?.message}</TextError>
          </div>
        </li>

        {isAlwaysAllow && (
          <li className="flex flex-col items-start gap-[11px] self-stretch">
            <label
              htmlFor="visitPurpose"
              className="flex items-center gap-1 px-1 py-0 pretendard-15SemiBold text-defaults-primary-text-primary"
            >
              <span>방문 목적</span>
              <EssentialMark />
            </label>
            <Controller
              control={control}
              name="visitPurpose"
              render={({ field }) => {
                return (
                  <VisitPurposeSelect
                    id="visitPurpose"
                    value={field.value}
                    list={visitPurposeList ?? []}
                    isLoading={isVisitPurposeLoading}
                    isError={isVisitPurposeError}
                    placeholder={CAR_FORM_PLACEHOLDER.visitPurpose}
                    onChange={field.onChange}
                  />
                )
              }}
            />
            <TextError>{errors.visitPurpose?.message}</TextError>
          </li>
        )}

        {isAlwaysAllow && (
          <li className="flex flex-col items-start gap-[11px] self-stretch">
            <label
              htmlFor="memo"
              className="flex items-center gap-1 px-1 py-0 pretendard-15SemiBold text-defaults-primary-text-primary"
            >
              메모
            </label>
            <div className="flex w-full flex-col items-start gap-[6px]">
              <Controller
                control={control}
                name="memo"
                render={({ field }) => {
                  return (
                    <textarea
                      id="memo"
                      value={field.value ?? ''}
                      maxLength={CAR_FORM_MAX_LENGTH.memo}
                      placeholder={CAR_FORM_PLACEHOLDER.memo}
                      className="flex min-h-[105px] w-full flex-col items-start justify-center gap-2.5 self-stretch rounded border border-defaults-tertiary-border-tertiary p-2.5 px-3 pretendard-16Regular font-['Pretendard'] text-defaults-primary-text-primary placeholder:text-defaults-tertiary-text-tertiary"
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                    />
                  )
                }}
              />
              <TextError>{errors.memo?.message}</TextError>
            </div>
          </li>
        )}

        {hasWallPadField && (
          <li className="flex flex-col items-start gap-[11px] self-stretch">
            <label
              htmlFor="parkingWallPadAlarm"
              className="flex flex-col gap-1 px-1 py-0 pretendard-15SemiBold text-defaults-primary-text-primary"
            >
              <div className="flex gap-1">
                입출차 시 월패드 알림
                <EssentialMark />
              </div>
              <div className="flex flex-col gap-1 pretendard-14Regular">
                {PARKING_WALL_PAD_ALARM_DESCRIPTION.map((description) => {
                  return <p key={description}>{description}</p>
                })}
              </div>
            </label>
            <div className="flex w-full flex-col items-start gap-[6px]">
              <Controller
                control={control}
                name="parkingWallPadAlarm"
                render={({ field }) => {
                  return (
                    <InputRadioDual
                      name="parkingWallPadAlarm"
                      list={PARKING_WALL_PAD_ALARM_INPUT}
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                    />
                  )
                }}
              />
              <TextError>{errors.parkingWallPadAlarm?.message}</TextError>
            </div>
          </li>
        )}
      </ul>

      {/* `width: calc(100% - 32px)`는 레거시 `<style scoped>`에 있던 것을 임의값으로 옮겼다 */}
      <ButtonBase
        type="submit"
        className="fixed bottom-4 left-4 flex w-[calc(100%-32px)] justify-center"
        roundType="rounded"
        size="xl"
        color={hasNoError ? 'brand' : 'defaults-secondary'}
        hasOutline={!hasNoError}
        disabled={isPending}
      >
        {isPending ? <SpinnerCircle /> : <span>{isAddPage ? '등록' : '수정'}하기</span>}
      </ButtonBase>
    </form>
  )
}
