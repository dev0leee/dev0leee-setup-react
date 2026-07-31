import { useRef, useState } from 'react'

import { ModalImageViewer } from '@/shared/components/common/ModalImageViewer'
import { isNativeApp } from '@/shared/lib/native/bridge'
import { nativeOpenSystemBrowser } from '@/shared/lib/native/common'
import { sanitizeHtml } from '@/shared/lib/sanitizeHtml'
import { cn } from '@/shared/utils/cn'

import '@/styles/quill.snow.css'

/**
 * Quill 본문 렌더 + 클릭 위임. 레거시 `NoticeDetailView`의 본문 영역 이식.
 *
 * **본문은 서버가 만든 HTML이라 이벤트를 직접 붙일 수 없다.** 그래서 컨테이너 하나에
 * 클릭을 걸고 대상에 따라 갈라낸다:
 *  - `<img>` → 이미지 뷰어 모달 (원본 `src` 그대로. S3 접두사를 붙이지 않는다)
 *  - `<a>` → 앱이면 시스템 브라우저, 웹이면 새 탭. **이 도메인의 유일한 브릿지 호출이다**
 *
 * ⚠️ 레거시는 `watch(htmlContent)` → `addEventListener`로 붙이고 본문이 바뀔 때마다
 * **중복 등록**한다(같은 함수 참조라 브라우저가 무시해서 피해는 없다). React는 JSX의
 * `onClick`이 위임을 대신하므로 그 구조가 필요 없다 — 동작은 같다.
 *
 * ⚠️ **`.ql-editor`의 패딩을 0으로 덮는다.** 레거시 `<style scoped>`의
 * `.content { padding: 0 !important }`에 대응한다. Quill 기본 패딩(12px 15px)이 남으면
 * 본문이 안쪽으로 밀려 레이아웃이 달라진다.
 */
export const BoardDetailContent = ({
  html,
  /** B2는 `ql-snow` 래퍼가 있고 B4는 없다. 서식이 실제로 달라진다 (`board.md` BD-Q6) */
  hasQuillWrapper,
}: {
  html: string
  hasQuillWrapper: boolean
}) => {
  const [viewerImageUrl, setViewerImageUrl] = useState<string | null>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  const handleContentClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement

    if (target.tagName === 'IMG') {
      setViewerImageUrl((target as HTMLImageElement).src)
      return
    }

    const anchor = target.closest('a')
    if (!anchor?.href) return

    event.preventDefault()

    if (isNativeApp()) {
      nativeOpenSystemBrowser({ targetUrl: anchor.href })
      return
    }

    window.open(anchor.href, '_blank')
  }

  const content = (
    <div
      ref={contentRef}
      className={cn('ql-editor w-full text-left pretendard-15Regular', '[&]:p-0')}
      // 본문은 서버가 만든 HTML이다. 살균 후에만 넣는다 (`sanitizeHtml`).
      dangerouslySetInnerHTML={{ __html: sanitizeHtml({ html }) }}
      onClick={handleContentClick}
    />
  )

  return (
    <>
      {hasQuillWrapper ? <div className="ql-snow">{content}</div> : content}

      <ModalImageViewer
        open={viewerImageUrl !== null}
        imageUrl={viewerImageUrl ?? ''}
        onClose={() => {
          setViewerImageUrl(null)
        }}
      />
    </>
  )
}
