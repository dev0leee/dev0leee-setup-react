import { AptInfoHeaderItem } from '@/features/main/components/AptInfoHeaderItem'
import { APT_DRAWER_SKELETON_COUNT, APT_DRAWER_TEXT } from '@/features/main/constants/main'
import { useResidentAptList } from '@/features/main/queries/useResidentAptList'
import type { AptInfoHeaderDrawerProps } from '@/features/main/types/main'
import { ButtonBase } from '@/shared/components/common/ButtonBase'
import { DrawerBase } from '@/shared/components/common/DrawerBase'
import { SkeletonBase } from '@/shared/components/common/SkeletonBase'
import { useChangeApt } from '@/shared/hooks/useChangeApt'
import { RESIDENT_STATE } from '@/shared/types/resident'

/**
 * 단지 전환 드로어. 레거시 `AptInfoHeaderDrawer.vue` 이식.
 *
 * 목록 영역 높이가 **세 상태 모두 `h-[278px]`로 고정**돼 있다 — 로딩·에러·정상에서
 * 드로어 크기가 흔들리지 않게 하는 장치다.
 *
 * ⚠️ **미승인 단지를 골랐을 때의 안내 모달은 옮기지 않았다 — 레거시에서 뜨지 않는다.**
 * `selectApt`가 `closeModal()`을 먼저 호출하고, 부모가 `v-if="isDrawerOpen"`으로 이 컴포넌트를
 * 언마운트한다. 모달 상태가 **언마운트되는 컴포넌트 안에** 있어서 DOM 패치 시점에는 이미
 * 사라져 있다. 즉 미승인 단지를 눌러도 **드로어만 닫히고 아무 안내도 없다.**
 * 살리려면 모달 상태를 `AptInfoHeader`로 올려야 한다 (`deferred.md` D-216).
 */
export const AptInfoHeaderDrawer = ({ open, onClose }: AptInfoHeaderDrawerProps) => {
  const onChangeApt = useChangeApt()
  const { residentAptList, isResidentAptListLoading, isResidentAptListError } = useResidentAptList()

  const renderContent = () => {
    if (isResidentAptListLoading) {
      return (
        <ul className="flex h-[278px] w-full flex-col gap-[10px] overflow-y-auto px-5 py-0">
          {Array.from({ length: APT_DRAWER_SKELETON_COUNT }).map((_, index) => {
            return (
              <li
                // 스켈레톤은 서로 구분할 값이 없어 인덱스를 키로 쓴다
                key={index}
                className="flex w-full items-center gap-[7px] rounded-xl border border-defaults-tertiary-border-tertiary bg-base-b-white px-5 py-6"
              >
                <div className="flex items-start gap-[10px]">
                  <SkeletonBase className="h-6 w-6 rounded" />
                  <div className="flex flex-col gap-2">
                    <SkeletonBase className="h-5 w-48 rounded" />
                    <SkeletonBase className="h-4 w-32 rounded" />
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )
    }

    if (isResidentAptListError) {
      return (
        <div className="flex h-[278px] w-full flex-col items-center justify-center gap-4 px-5 text-center">
          <p className="text-defaults-secondary-text-secondary">
            {APT_DRAWER_TEXT.LOAD_ERROR[0]} <br />
            {APT_DRAWER_TEXT.LOAD_ERROR[1]}
          </p>
        </div>
      )
    }

    return (
      <ul className="flex h-[278px] w-full flex-col gap-[10px] overflow-y-auto px-5 py-0">
        {residentAptList?.map((apt) => {
          return (
            <AptInfoHeaderItem
              key={apt.aptUuid}
              aptInfo={apt}
              onSelect={(selectedApt) => {
                // 승인 여부를 보기 전에 먼저 닫는다 (레거시 순서)
                onClose()

                // 미승인이면 아무 일도 일어나지 않는다 — 레거시의 안내 모달은
                // 이 컴포넌트가 언마운트되며 함께 사라져 실제로 뜨지 않는다 (D-216)
                if (selectedApt.residentState !== RESIDENT_STATE.APPROVED) return

                void onChangeApt({ newAptInfo: selectedApt })
              }}
            />
          )
        })}
      </ul>
    )
  }

  return (
    <DrawerBase
      open={open}
      onClose={onClose}
      hasButtons
      buttons={
        <ButtonBase
          type="button"
          roundType="rounded"
          color="brand"
          className="h-10"
          onClick={onClose}
        >
          {APT_DRAWER_TEXT.CLOSE}
        </ButtonBase>
      }
    >
      {renderContent()}
    </DrawerBase>
  )
}
