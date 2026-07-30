/**
 * 외부 페이지 임베드. 레거시 `IframeBase.vue`.
 * 스크롤바를 숨기고 `overscroll-contain`으로 바깥 화면이 함께 튀는 것을 막는다.
 */
export const IframeBase = ({ title = '', src = '' }: { title?: string; src?: string }) => {
  return (
    <iframe
      title={title}
      src={src}
      className="h-full w-full overscroll-contain [-moz-scrollbars:none] [&::-webkit-scrollbar]:hidden [&::-webkit-scrollbar]:w-0"
    />
  )
}
