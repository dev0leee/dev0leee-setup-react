import { useNavigate } from 'react-router-dom'

import {
  MAX_TEMP_PASSWORD_COUNT,
  TEMP_PASSWORD_BADGE,
  TEMP_PASSWORD_MESSAGE,
} from '@/features/visit/constants/visit'
import {
  useDeleteTempPassword,
  useTempPasswordList,
} from '@/features/visit/queries/useTempPassword'
import { ROUTE_PATH } from '@/shared/constants/routes'
import { showToast } from '@/shared/lib/toast'
import { cn } from '@/shared/utils/cn'
import { copyValue } from '@/shared/utils/copyValue'
import { formatHtmlText } from '@/shared/utils/formatHtmlText'

/**
 * 메모를 한 줄로 누른다. 주차 차량관리의 `memo` 처리와 **같은 규칙**이다
 * (`<br>` 제거 → 개행·탭 → 공백 → 연속 공백 1개 → `trim`). 없으면 `-`.
 */
const processDescription = (description: string | null | undefined) => {
  if (!description) return '-'

  return formatHtmlText({ text: description })
    .replaceAll(/<br\s*\/?>/g, ' ')
    .replaceAll(/[\r\n\t]+/g, ' ')
    .replaceAll(/\s+/g, ' ')
    .trim()
}

/**
 * 임시 비밀번호 목록 (V4).
 * 레거시 `VisitLobbyPhoneTempPasswordListView.vue`(149 LOC) 이식.
 *
 * 🔴 **삭제에 확인 모달이 없다.** 휴지통을 누르면 즉시 지워진다 — 게시판·주차는 전부
 * 확인을 거치는데 이 화면만 다르다 (`deferred.md`). 등가 이관이라 그대로 옮겼다.
 *
 * ⚠️ **안내 문구는 목록이 있을 때만 보인다.** 0건이면 빈 상태 문구만 나온다.
 *
 * ⚠️ **조회에 실패하면 훅이 모달을 띄우고 `/main`으로 보낸다.** 그래서 "에러 시 회색
 * 생성 버튼"은 사실상 볼 일이 없다 — 그래도 레거시 분기를 그대로 옮겼다.
 *
 * ⚠️ 레거시는 `list.value.length`를 옵셔널 없이 읽어 **조회 실패 시 TypeError**가 났다.
 * 안전하게 옮겼다 — 정상 경로에서는 결과가 같다.
 */
export const TempPasswordListPage = () => {
  const navigate = useNavigate()
  const { tempPasswordList, isTempPasswordListError } = useTempPasswordList()
  const { deleteTempPasswordMutation } = useDeleteTempPassword()

  const hasPasswords = (tempPasswordList?.length ?? 0) > 0

  const createNewPassword = () => {
    if ((tempPasswordList?.length ?? 0) >= MAX_TEMP_PASSWORD_COUNT) {
      showToast({ message: TEMP_PASSWORD_MESSAGE.limit })
      return
    }

    void navigate(ROUTE_PATH.VISIT_TEMP_PASSWORD_CREATE)
  }

  return (
    <div className="h-full overflow-auto bg-defaults-secondary-background-mono px-4">
      {hasPasswords && (
        <p className="ml-1 py-4 pretendard-14Regular text-[#888]">{TEMP_PASSWORD_MESSAGE.guide}</p>
      )}

      {hasPasswords ? (
        <div>
          {tempPasswordList?.map((item) => {
            const badge =
              TEMP_PASSWORD_BADGE[item.tempPasswordType === 'TEMPOTP' ? 'TEMPOTP' : 'TEMPTERM']

            return (
              <div key={item.uuid} className="mb-4 rounded-lg bg-base-b-white p-4 shadow-md">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="mb-2 flex items-center">
                      <span
                        className={cn(
                          'mr-2 rounded-full px-2 py-1 pretendard-12Regular text-base-b-white',
                          badge.className,
                        )}
                      >
                        {badge.label}
                      </span>
                      <h2 className="pretendard-20Bold">{item.password}</h2>
                      <button
                        type="button"
                        className="ml-2 flex items-center justify-between gap-0.5 rounded-md border border-defaults-secondary-border-secondary px-2 py-1 pretendard-12Medium text-navy-default-text-navy"
                        onClick={() => {
                          void copyValue({
                            value: item.password,
                            onCopied: () => {
                              showToast({ message: TEMP_PASSWORD_MESSAGE.copied })
                            },
                          })
                        }}
                      >
                        <img src="/assets/icons/icon_copy.svg" alt="복사 아이콘" />
                        복사
                      </button>
                    </div>
                  </div>

                  {/* 🔴 확인 없이 즉시 삭제된다 (레거시 동일) */}
                  <button
                    type="button"
                    className="text-red-500"
                    onClick={() => {
                      deleteTempPasswordMutation({ uuid: item.uuid })
                    }}
                  >
                    <img src="/assets/icons/icon_trash.svg" alt="삭제 아이콘" />
                  </button>
                </div>

                <div className="mb-3 border border-[#f3f3f3]" />

                <div className="w-full pretendard-14Regular">
                  <div className="flex items-center justify-between">
                    <div className="text-defaults-tertiary-text-tertiary">생성자</div>
                    <div className="text-right text-defaults-tertiary-text-tertiary">
                      {item.residentName ?? TEMP_PASSWORD_MESSAGE.adminCreator}
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-3">
                    <div className="text-defaults-tertiary-text-tertiary">유효기간</div>
                    <div className="text-right text-defaults-tertiary-text-tertiary">
                      ~{item.endDate}
                    </div>
                  </div>

                  <div className="flex items-start justify-between">
                    <div className="min-w-[40px] text-defaults-tertiary-text-tertiary">메모</div>
                    <div className="overflow-hidden text-right break-words text-defaults-tertiary-text-tertiary">
                      {processDescription(item.description)}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
          <p className="text-center text-defaults-tertiary-text-tertiary">
            {TEMP_PASSWORD_MESSAGE.empty}
          </p>
        </div>
      )}

      <div className="fixed right-0 bottom-6 z-10 px-5">
        <button
          type="button"
          className={cn(
            'flex h-14 w-14 items-center justify-center rounded-full text-base-b-white shadow-lg',
            isTempPasswordListError
              ? 'bg-defaults-tertiary-border-tertiary'
              : 'bg-gradient-to-t from-[#3763d1] to-[#0037BE]',
          )}
          onClick={createNewPassword}
        >
          <img src="/assets/icons/icon-plus-white.svg" alt="플러스 아이콘" className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}
