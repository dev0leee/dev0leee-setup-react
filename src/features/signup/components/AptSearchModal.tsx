import { useState } from 'react'

import { AptSearchItem } from '@/features/signup/components/AptSearchItem'
import { APT_SEARCH_TEXT } from '@/features/signup/constants/signup'
import { useAptList } from '@/features/signup/queries/useAptList'
import type { AptSearchModalProps } from '@/features/signup/types/signup'
import { InputSearch } from '@/shared/components/common/InputSearch'

/**
 * 아파트 검색 모달. 레거시 `SignUpAptInfoSearchModal.vue` 이식.
 *
 * ⚠️ **`ModalBase`를 쓰지 않았다.** 레거시가 자체 오버레이 마크업을 갖고 있고 크기·모서리가
 * 확인 모달과 다르다. 공용 모달로 바꾸면 화면이 달라진다.
 *
 * ⚠️ **`검색 결과가 없습니다`와 결과 목록의 표시 조건이 다르다.**
 * 문구는 `aptList.length === 0`이면 보이고, 목록은 `searchKeyword`가 있어야 보인다 —
 * 즉 **검색 전에도 문구가 보일 수 있다**(빈 키워드 응답이 빈 배열이면). 레거시 그대로다
 * (`signup.md` S-Q6).
 *
 * ⚠️ 입력값을 상태로 들고 있지 않다. 레거시가 제출 시 `event.target.aptSearch.value`로
 * DOM에서 직접 읽는다 — 검색어는 폼 제출 순간에만 필요해서 제어 상태로 만들 이유가 없다.
 * 다만 `InputSearch`가 제어 컴포넌트라 값은 여기서 들고 있어야 한다.
 */
export const AptSearchModal = ({ onClose }: AptSearchModalProps) => {
  const { aptList, searchApt } = useAptList()
  const [keyword, setKeyword] = useState('')
  /** 제출된 검색어. 입력 중에는 목록이 나타나지 않아야 한다 */
  const [submittedKeyword, setSubmittedKeyword] = useState('')

  return (
    <div
      className="fixed top-0 left-0 z-[9999] flex h-screen w-screen items-center justify-center bg-black/50"
      // 레거시는 오버레이 클릭으로 닫는다. 모달 안쪽 클릭은 아래에서 멈춘다.
      onClick={() => {
        onClose()
      }}
      role="presentation"
    >
      <div
        className="flex w-[80vw] max-w-96 flex-col items-center rounded-xl bg-white"
        onClick={(event) => {
          event.stopPropagation()
        }}
        role="presentation"
      >
        <div className="flex items-center justify-between gap-4 self-stretch py-3 pr-[10px] pl-5 pretendard-18Bold text-defaults-primary-text-primary">
          <h2>{APT_SEARCH_TEXT.TITLE}</h2>
          <button
            type="button"
            className="h-7 w-7"
            onClick={() => {
              onClose()
            }}
          >
            <img src="/assets/icons/Close.svg" alt="닫기 아이콘" />
          </button>
        </div>

        <div className="flex w-full justify-center gap-3 self-stretch pt-0 pr-5 pb-6 pl-5">
          <form
            className="flex w-full flex-col items-start gap-5 self-stretch"
            onSubmit={(event) => {
              event.preventDefault()
              setSubmittedKeyword(keyword)
              searchApt(keyword)
            }}
          >
            <div className="flex w-full flex-col justify-start gap-[6px]">
              <InputSearch id="aptSearch" value={keyword} onChange={setKeyword} />
              <p className="pretendard-12Regular break-keep whitespace-break-spaces text-neutral-b-gray-500">
                단지명이나 지역명으로 조회 가능합니다 <br />
                (예 : &apos;안양한양수자인에듀파크&apos;는 &apos;한양수자인&apos; 또는
                &apos;안양&apos;)
              </p>
            </div>

            {/* ⚠️ `border-primary-100`은 config에 없던 오타다. 대상 토큰이 있어 고쳐 적용했다
                — 테두리가 기본 회색에서 연한 브랜드 파랑으로 바뀐다 (`broken-styles.md` §0) */}
            <div className="relative flex h-[132px] w-full flex-col items-center justify-center rounded-lg border border-primary-pc-indigo-100 bg-[#fafbfc]">
              {aptList?.length === 0 && (
                <p className="absolute top-1/2 translate-y-[-50%] font-medium">
                  {APT_SEARCH_TEXT.EMPTY}
                </p>
              )}
              {submittedKeyword && (
                <ul className="flex h-full w-full flex-col items-center justify-start gap-[6px] overflow-auto p-2">
                  {aptList?.map((apt) => {
                    return (
                      <AptSearchItem
                        key={apt.uuid}
                        aptInfo={apt}
                        onSelectApt={(selected) => {
                          onClose(selected)
                        }}
                      />
                    )
                  })}
                </ul>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
