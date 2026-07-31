import { SkeletonBase } from '@/shared/components/common/SkeletonBase'
import { SpinnerCircle } from '@/shared/components/common/SpinnerCircle'

/**
 * MF1 로딩 스켈레톤. 레거시 `ManagementFeeDetailLoading.vue`.
 *
 * ✅ **MF-Q4 결정 적용 — 월 선택기 스켈레톤을 뺐다.** 레거시는 고지서를 조회하는 동안
 * **실제 월 선택기와 스켈레톤 월 선택기가 동시에 보여 두 개로 겹쳤다**(월 선택기는
 * 년월 목록만 있으면 렌더된다). 이제 하나만 보인다.
 *
 * ✅ **MF-Q3 결정 적용 — `상세내역` 헤더를 `border-b`로 맞췄다.** 레거시 스켈레톤은
 * `border-b-2`라 로딩이 끝나는 순간 1px 튀었다. 텍스트 스타일도 실제 화면과 맞췄다.
 */
export const ManagementFeeDetailSkeleton = () => {
  return (
    <>
      <div className="flex flex-col gap-3 bg-base-b-white px-5 pb-5">
        <div className="flex items-center justify-between">
          <SkeletonBase className="h-5 w-28 rounded" />
          <SkeletonBase className="h-5 w-32 rounded" />
        </div>
        <div className="flex items-center gap-2">
          <SkeletonBase className="h-10 w-40 rounded" />
          <SkeletonBase className="h-6 w-12 rounded-full" />
        </div>
      </div>

      <div className="mt-2 bg-base-b-white">
        <div className="flex items-center justify-between p-5">
          <div className="flex items-center gap-2">
            <SkeletonBase className="h-4 w-4 rounded-full" />
            <SkeletonBase className="h-5 w-20 rounded" />
          </div>
          <SkeletonBase className="h-5 w-24 rounded" />
        </div>
        <div className="flex items-center justify-between p-5">
          <SkeletonBase className="h-5 w-28 rounded" />
          <SkeletonBase className="h-5 w-24 rounded" />
        </div>
      </div>

      <div className="mt-2 flex flex-1 flex-col bg-base-b-white pb-8">
        <div className="border-b border-neutral-b-gray-100 px-5 py-4 pretendard-14Medium text-defaults-secondary-text-secondary">
          상세내역
        </div>
        <div className="flex flex-1 items-center justify-center">
          <SpinnerCircle color="blue" />
        </div>
      </div>
    </>
  )
}
