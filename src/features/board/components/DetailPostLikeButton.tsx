import { useEffect, useState } from 'react'

import type { BoardPostDetail } from '@/features/board/types/detail'

/**
 * 좋아요 / 동의해요 버튼. 레거시 `DetailPostLikeButton.vue` 이식.
 *
 * **서버 응답을 다시 받지 않고 화면만 바꾼다.** 카운트는 서버가 준 값을 기준으로
 * ±1 해서 만든다:
 *
 * | 처음 상태(`isInitialLiked`) | 지금 눌린 상태 | 표시 카운트 |
 * | --------------------------- | -------------- | ----------- |
 * | 눌려 있었음                 | 눌림           | 기준값      |
 * | 눌려 있었음                 | 안 눌림        | 기준값 − 1  |
 * | 안 눌려 있었음              | 눌림           | 기준값 + 1  |
 * | 안 눌려 있었음              | 안 눌림        | 기준값      |
 *
 * 🔴 **화면당 한 번만 반응한다.** 레거시가 mutation의 `isSuccess` **전이**를 보는데
 * `isSuccess`는 한 번 참이 되면 계속 참이라 두 번째 클릭부터는 아이콘도 숫자도 그대로다.
 * 서버에는 매번 전달되므로 나갔다 들어오면 반영돼 있다. **등가 이관이라 재현한다** —
 * `useEffect`의 deps가 `true`로 고정되면 자연히 같은 동작이 된다
 * (`board.md` §DetailPostLikeButton).
 */
export const DetailPostLikeButton = ({
  label,
  postData,
  isSuccessPostLiked,
  onLike,
}: {
  /** 소통공간 `좋아요` · 민원공간 `동의해요` */
  label: string
  postData: BoardPostDetail
  isSuccessPostLiked: boolean
  onLike: () => void
}) => {
  const [isLiked, setIsLiked] = useState(postData.likeFlag ?? false)
  const [initialLiked, setInitialLiked] = useState(postData.likeFlag ?? false)
  const [count, setCount] = useState(postData.likeCount ?? 0)

  // 응답이 도착하면 서버 값으로 맞춘다 (레거시 `watch(postData, { immediate: true })`)
  useEffect(() => {
    setIsLiked(postData.likeFlag ?? false)
    setInitialLiked(postData.likeFlag ?? false)
    setCount(postData.likeCount ?? 0)
  }, [postData])

  /**
   * 🔴 **`isSuccessPostLiked`가 `true`가 되는 순간 한 번만 돈다.** 두 번째 클릭에는
   * 값이 이미 `true`라 effect가 다시 실행되지 않는다 — 레거시와 같은 동작이다.
   */
  useEffect(() => {
    if (!isSuccessPostLiked) return

    setIsLiked((prev) => {
      const next = !prev
      const baseCount = postData.likeCount ?? 0

      if (initialLiked) setCount(next ? baseCount : baseCount - 1)
      else setCount(next ? baseCount + 1 : baseCount)

      return next
    })
    // `postData`·`initialLiked`를 넣으면 응답이 갱신될 때마다 카운트가 또 뒤집힌다.
    // 레거시도 성공 신호 하나만 본다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccessPostLiked])

  return (
    <button
      type="button"
      className="flex w-fit items-center gap-[3px] rounded-[5px] border border-defaults-secondary-border-secondary px-2.5 py-2 pretendard-14Regular text-defaults-primary-text-primary"
      onClick={onLike}
    >
      <img
        className="h-4 w-4"
        src={`/assets/icons/ThumbsUp${isLiked ? 'Accent' : ''}.svg`}
        alt="엄지 아이콘"
      />
      <span>{label}</span>
      <span>{count}</span>
    </button>
  )
}
