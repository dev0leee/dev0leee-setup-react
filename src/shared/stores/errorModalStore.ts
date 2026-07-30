import { create } from 'zustand'

import type { ErrorModalOptions, ErrorModalState } from '@/shared/types/errorModal'

/**
 * 레거시 `lib/swalModal/swalErrorModal.js`를 대신하는 명령형 모달 상태.
 *
 * **76개 파일 · 293곳**이 뮤테이션 콜백 안에서 `swalErrorModal({ text })`를 부른다.
 * 컴포넌트 밖에서 호출되므로 훅으로 만들 수 없다 — sonner `toast()`와 같은 형태다.
 * 실제 렌더는 `App.tsx`에 한 번 마운트한 `ErrorModal`이 담당한다.
 *
 * SweetAlert2는 열려 있는 동안 `Swal.fire`를 또 부르면 내용을 갈아끼운다.
 * 그래서 큐가 아니라 **현재 하나**만 들고 있는다.
 */
export const useErrorModalStore = create<ErrorModalState>((set, get) => {
  return {
    current: null,

    open: (options: ErrorModalOptions) => {
      set({ current: options })
    },

    /** 확인 버튼으로 닫힘. 레거시는 이때만 callback을 부른다 */
    confirm: () => {
      const { current } = get()
      set({ current: null })
      current?.callback?.()
    },

    /** 배경 클릭·Esc로 닫힘. callback을 부르지 않는다 */
    dismiss: () => {
      set({ current: null })
    },
  }
})
