import { useState } from 'react'

import { env } from '@/config/env'
import { AptInfoHeaderAptName } from '@/features/main/components/AptInfoHeaderAptName'
import { AptInfoHeaderDrawer } from '@/features/main/components/AptInfoHeaderDrawer'
import { SkeletonBase } from '@/shared/components/common/SkeletonBase'
import { useResidentDetailInfo } from '@/shared/hooks/useResidentDetailInfo'

/**
 * 단지 헤더. 레거시 `AptInfoHeader/AptInfoHeader.vue` 이식.
 *
 * ```
 * [로고] 아파트먼트 아파트        101동 1001호 ▼
 * ```
 *
 * ⚠️ **동/호수가 없으면 `0`을 표시한다** (`dong || 0`). 빈 문자열이 아니라 숫자 0이다.
 *
 * ⚠️ 동호수 숫자만 **Outfit 폰트**(`outfit-20SemiBold`)다. 단위(`동`/`호`)는 Pretendard다.
 *
 * ⚠️ 로고는 서버 값이 있으면 S3 파일 버킷에서, 없으면 기본 로고를 쓴다. `alt`도 갈린다.
 */
export const AptInfoHeader = () => {
  const { residentDetailInfo, isResidentDetailInfoLoading } = useResidentDetailInfo()
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  return (
    <div className="relative flex flex-col items-start justify-center gap-3 self-stretch">
      {isResidentDetailInfoLoading ? (
        <div className="flex items-center justify-between self-stretch">
          <div className="flex items-center gap-[5px]">
            <SkeletonBase className="h-6 w-6 rounded-[36px]" />
            <SkeletonBase className="h-4 w-24 rounded" />
          </div>
          <div className="flex items-center gap-[6px]">
            <SkeletonBase className="h-7 w-12 rounded" />
            <SkeletonBase className="h-7 w-12 rounded" />
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3 self-stretch">
          <div className="flex items-center gap-[5px] pretendard-14Bold text-[#404040]">
            {residentDetailInfo?.aptLogoFileUrl ? (
              <img
                className="flex h-6 w-6 items-center justify-center rounded-[36px] border border-[#ebebeb] bg-base-b-white"
                src={`${env.VITE_S3_BUCKET_URL_FILE}${residentDetailInfo.aptLogoFileUrl}`}
                alt={`${residentDetailInfo.aptName} 로고`}
              />
            ) : (
              <img
                className="flex h-6 w-6 items-center justify-center rounded-[36px] border border-[#ebebeb] bg-base-b-white"
                src="/assets/images/aptmantLogoShort.png"
                alt="아파트먼트 기본 로고"
              />
            )}
            <AptInfoHeaderAptName aptName={residentDetailInfo?.aptName} />
          </div>

          <div
            className="flex items-center gap-[6px] text-[#1c1c1c]"
            onClick={() => {
              setIsDrawerOpen(true)
            }}
            role="presentation"
          >
            <div className="flex items-end gap-[1px]">
              <span className="outfit-20SemiBold">{residentDetailInfo?.dong || 0}</span>
              <span className="flex w-3 flex-col justify-center pb-1 pretendard-14Bold">동</span>
            </div>
            <div className="flex items-end gap-[1px]">
              <span className="outfit-20SemiBold">{residentDetailInfo?.ho || 0}</span>
              <span className="flex w-3 flex-col justify-center pb-1 pretendard-14Bold">호</span>
            </div>
            {/* 레거시는 `residentDetailInfo`가 있을 때만 토글을 보여준다 */}
            {residentDetailInfo && (
              <img className="h-[14px] w-[14px]" src="/assets/icons/Toggle.svg" alt="토글 아이콘" />
            )}
          </div>
        </div>
      )}

      {isDrawerOpen && (
        <AptInfoHeaderDrawer
          open={isDrawerOpen}
          onClose={() => {
            setIsDrawerOpen(false)
          }}
        />
      )}
    </div>
  )
}
