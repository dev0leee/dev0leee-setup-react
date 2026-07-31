/**
 * 우하단 글쓰기 플로팅 버튼. 레거시 `WriteButton.vue` 이식.
 *
 * `bottom-20`은 하단 탭 위에 뜨게 하는 값이다. 게시판 화면에는 하단 탭이 없지만
 * 레거시가 그 값을 쓰고 있어 그대로 둔다.
 */
export const WriteButton = ({ onClick }: { onClick: () => void }) => {
  return (
    <button
      type="button"
      className="fixed right-7 bottom-20 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-t from-[#3763d1] to-[#0037BE] p-3 shadow-md"
      onClick={onClick}
    >
      <img src="/assets/icons/Pencil.svg" alt="작성 아이콘" />
    </button>
  )
}
