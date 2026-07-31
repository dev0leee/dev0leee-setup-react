/**
 * 쇼핑몰 진입 관련 상수.
 *
 * ⚠️ **URL이 하드코딩이다.** 레거시가 `useShoppingNavigation.js` 안에 문자열로 박아뒀다.
 * 환경변수로 빼면 스테이징·프로덕션이 다른 곳을 보게 되므로 이관에서는 값을 그대로 옮기고
 * 상수로만 끌어냈다 (`main.md` §11 · `deferred.md` D-39).
 */
export const SHOPPING_MALL_URL = 'https://m-apartmant34.shopby.co.kr'

/** 토큰 발급 실패 토스트. 문구의 어색한 띄어쓰기까지 레거시 그대로다 */
export const SHOPPING_ERROR_MESSAGE = '현재 접속이 불가합니다. 잠시후 다시 시도해주세요'

/**
 * ⚠️ **하드코딩된 단지 UUID 2개.** 광고 배너가 단지별로 다른 이미지를 띄운다.
 * 나머지 단지는 전부 `/assets/mocks/BannerTemp.png`(임시 이미지)를 본다 —
 * 의도된 것인지 확인이 필요하다 (`main.md` M-Q4 · `deferred.md` D-40).
 */
export const BANNER_APT_UUID = {
  /** 에테르노 청담 — 전용 이미지, 클릭 동작 없음 */
  ETERNO: 'd7a74391-30c5-4e08-b4ac-429a861f4204',
  /** 샘물정보통신 — S3 광고 이미지, 클릭 시 쇼핑몰 */
  SAMMUL: 'e98d2646-e073-40e2-9a7c-0786c0ac7444',
} as const

/** 샘물정보통신 배너 이미지 파일명. `VITE_S3_BUCKET_URL_STATICS` 아래에 있다 */
export const BANNER_ADVERTISING_IMAGE_PATH = '/main_banner_advertising.png'
