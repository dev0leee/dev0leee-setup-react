import { create } from 'zustand'

import type { VoteCertInfo, VoteCertState } from '@/features/vote/types/vote'
import { STORAGE_KEY } from '@/shared/constants/storage'
import { readJsonStorage, writeJsonStorage } from '@/shared/lib/jsonStorage'

/**
 * 비회원 투표 본인인증 정보. 레거시 `stores/vote.js` + `useVoteStorage.js` 이식.
 *
 * localStorage 키 `voteCertInfo`에 JSON으로 저장한다. 값이 없으면 `{}`다 —
 * 레거시 기본값이 그렇고, 소비자들이 그 계약에 맞춰 옵셔널 체이닝으로 읽는다.
 *
 * 외부 링크로 들어온 사용자가 새로고침해도 인증을 다시 하지 않게 하려고 저장한다.
 */
export const useVoteCertStore = create<VoteCertState>((set, get) => {
  return {
    voteCertInfo: readJsonStorage<VoteCertInfo>({ key: STORAGE_KEY.VOTE_CERT_INFO, fallback: {} }),

    /** 레거시와 같이 **병합**이다. 호출부가 일부 필드만 넘긴다 */
    setVoteCertInfo: (voteCertInfo) => {
      const next = { ...get().voteCertInfo, ...voteCertInfo }
      writeJsonStorage({ key: STORAGE_KEY.VOTE_CERT_INFO, value: next })
      set({ voteCertInfo: next })
    },

    initVoteCertInfo: () => {
      writeJsonStorage({ key: STORAGE_KEY.VOTE_CERT_INFO, value: {} })
      set({ voteCertInfo: {} })
    },
  }
})
