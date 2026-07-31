import { useEffect, useState } from 'react'

import { USER_BLOCK_TEXT } from '@/features/board/constants/board'
import { useBlockBoardUser, useUnblockBoardUser } from '@/features/board/queries/useBoardMutations'
import { useBoardBlockedUserList } from '@/features/board/queries/useBoardPostDetail'
import type { BlockedUser } from '@/features/board/types/detail'
import { SpinnerDots } from '@/shared/components/common/SpinnerDots'
import { TextEmpty } from '@/shared/components/common/TextEmpty'

/**
 * 차단한 사용자 한 명. 레거시 `SettingUserBlockItem.vue` 이식.
 *
 * 🔴 **같은 항목을 3회 이상 토글하면 버튼이 멈춘다.** 상태를 mutation의 `isSuccess`
 * **전이**로 바꾸는데, `isSuccess`는 한 번 참이 되면 계속 참이라 두 번째 성공부터는
 * effect가 다시 돌지 않는다. 해제 → 재차단까지는 각각 다른 훅이라 동작하지만
 * **세 번째(재해제)부터 버튼이 안 바뀐다.** 화면을 나갔다 오면 서버 상태로 복구된다.
 * 상세 화면의 좋아요와 같은 유형이다 — 등가 이관이라 재현한다 (`board.md` §B19).
 *
 * ⚠️ **두 버튼의 `alt`가 둘 다 `안보기 아이콘`이다.** 아이콘 파일은 다르다. 그대로.
 */
const UserBlockItem = ({ blockedUser }: { blockedUser: BlockedUser }) => {
  // 목록에 있다는 것 자체가 차단 상태라는 뜻이다
  const [isBlocked, setIsBlocked] = useState(true)

  const { blockUser, isBlockUserSuccess } = useBlockBoardUser()
  const { unblockUser, isUnblockUserSuccess } = useUnblockBoardUser()

  useEffect(() => {
    if (!isUnblockUserSuccess) return
    setIsBlocked(false)
  }, [isUnblockUserSuccess])

  useEffect(() => {
    if (!isBlockUserSuccess) return
    setIsBlocked(true)
  }, [isBlockUserSuccess])

  return (
    <li className="flex w-full items-center justify-between border-b border-b-defaults-tertiary-border-tertiary px-5 py-[15px]">
      <div className="flex items-center gap-[6px]">
        <div className="flex h-[30px] w-[30px] items-center justify-center overflow-hidden rounded-full border border-defaults-tertiary-border-tertiary">
          <img className="h-[30px] w-[30px]" src="/assets/images/Profile.svg" alt="프로필 아이콘" />
        </div>
        <span className="pretendard-16SemiBold text-defaults-secondary-text-secondary">
          {blockedUser.residentBlockName.replaceAll(',', '') || '이름 없음'}
        </span>
      </div>

      {isBlocked ? (
        <button
          type="button"
          className="flex items-center justify-center gap-[5px] rounded-lg border border-navy-default-border-navy bg-white py-2 pr-4 pl-3 text-center pretendard-13SemiBold text-navy-default-text-navy"
          onClick={() => {
            unblockUser({ authorUuid: blockedUser.residentBlockUuid })
          }}
        >
          <img src="/assets/icons/EyeOff.svg" alt="안보기 아이콘" />
          <span>{USER_BLOCK_TEXT.BLOCKED}</span>
        </button>
      ) : (
        <button
          type="button"
          className="flex items-center justify-center gap-[5px] rounded-lg bg-navy-default-background-navy py-2 pr-4 pl-3 text-center pretendard-13SemiBold text-white"
          onClick={() => {
            blockUser({
              authorUuid: blockedUser.residentBlockUuid,
              authorTextName: blockedUser.residentBlockName,
            })
          }}
        >
          <img src="/assets/icons/Eye.svg" alt="안보기 아이콘" />
          <span>{USER_BLOCK_TEXT.UNBLOCKED}</span>
        </button>
      )}
    </li>
  )
}

/**
 * 게시글 미노출 사용자 관리 (B19). 레거시 `Setting/SettingUserBlockView.vue` 이식.
 *
 * 마이페이지에서 들어오며 **구독 콘텐츠와 무관하게 항상 보이는 메뉴**다.
 *
 * ⚠️ **해제해도 목록에서 사라지지 않는다.** 무효화하지 않고 버튼만 바뀐다 —
 * 실수로 해제했을 때 바로 되돌릴 수 있게 한 의도로 보인다. 그대로 옮겼다.
 */
export const UserBlockSettingPage = () => {
  const { blockedUserList, isBlockedUserListLoading } = useBoardBlockedUserList()

  return (
    <div className="flex h-full w-full flex-col overflow-auto">
      {isBlockedUserListLoading && <SpinnerDots />}

      {!isBlockedUserListLoading &&
        (blockedUserList.length > 0 ? (
          <ul className="flex w-full flex-col px-0 py-4">
            {blockedUserList.map((blockedUser) => {
              return <UserBlockItem key={blockedUser.residentBlockUuid} blockedUser={blockedUser} />
            })}
          </ul>
        ) : (
          <TextEmpty className="flex-1">{USER_BLOCK_TEXT.EMPTY}</TextEmpty>
        ))}
    </div>
  )
}
