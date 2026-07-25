/** 프로덕션 트레이스 샘플링 비율. 전량 수집은 비용이 커서 10%만 보낸다. */
export const PRODUCTION_TRACES_SAMPLE_RATE = 0.1

/** 개발·스테이징은 트래픽이 적으니 전량 수집한다. */
export const DEVELOPMENT_TRACES_SAMPLE_RATE = 1.0
