## 무엇을

<!-- 이 PR이 바꾸는 것을 한두 줄로. 티켓이 있으면 링크. -->

## 왜

<!-- 배경과 판단 근거. "무엇을"만 봐도 알 수 있는 내용은 반복하지 않는다. -->

## 어떻게 확인했나

<!-- CI 통과는 기본값이므로 적지 않는다. 사람이 직접 확인한 것만. -->
<!-- 예: 로컬에서 401 만료 후 재발급 되는지 확인 / 탭 2개 띄워 동시 refresh 확인 -->

## 체크리스트

- [ ] `pnpm typecheck && pnpm lint && pnpm format:check && pnpm test` 로컬 통과
- [ ] `import.meta.env` 직접 사용 없음 (`@/config/env`의 `env`만 사용)
- [ ] `axios` 직접 import 없음 (`@/shared/lib/apiClient`의 `api`만 사용)
- [ ] 서버 데이터를 Zustand에 복사하지 않음 (TanStack Query가 소유)
- [ ] `src/shared/components/ui/**` 직접 수정 없음 (커스텀은 래퍼로 분리)
- [ ] 새 페이지면 `router.tsx`에 lazy로 추가

## 리뷰어가 봐줬으면 하는 곳

<!-- 자신 없는 부분, 설계 판단이 갈릴 수 있는 부분. 없으면 "없음". -->
