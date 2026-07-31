import { create } from 'zustand'

import { STORAGE_KEY } from '@/shared/constants/storage'
import { readJsonStorage, writeJsonStorage } from '@/shared/lib/jsonStorage'
import type { SurveyCertInfo, SurveyCertState } from '@/shared/types/certStore'

/**
 * 비회원 설문 본인인증 정보. 레거시 `stores/survey.js` + `useSurveyStorage.js` 이식.
 * 구조·저장 방식이 투표(`voteCertStore`)와 같다.
 */
export const useSurveyCertStore = create<SurveyCertState>((set, get) => {
  return {
    surveyCertInfo: readJsonStorage<SurveyCertInfo>({
      key: STORAGE_KEY.SURVEY_CERT_INFO,
      fallback: {},
    }),

    /** 레거시와 같이 **병합**이다 */
    setSurveyCertInfo: (surveyCertInfo) => {
      const next = { ...get().surveyCertInfo, ...surveyCertInfo }
      writeJsonStorage({ key: STORAGE_KEY.SURVEY_CERT_INFO, value: next })
      set({ surveyCertInfo: next })
    },

    initSurveyCertInfo: () => {
      writeJsonStorage({ key: STORAGE_KEY.SURVEY_CERT_INFO, value: {} })
      set({ surveyCertInfo: {} })
    },
  }
})
