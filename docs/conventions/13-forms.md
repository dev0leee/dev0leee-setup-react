# 13. 폼 / 입력요소 / 인터랙션

react-hook-form + zod(`zodResolver`) + Base UI. 폼 값은 react-hook-form이 소유한다
([04-state](./04-state.md)).

## 접근 가능한 기본 요소를 쓴다 (MUST)

**`div` + `svg` + `onClick`으로 입력요소를 흉내내지 않는다.** 체크박스·라디오·스위치 같은
컨트롤은 네이티브의 접근성을 유지하는 Base UI 컴포넌트를 쓴다.

흉내낸 컨트롤은 세 가지가 한꺼번에 깨진다 — **키보드로 조작 안 되고, 스크린리더가 못 읽고,
테스트가 `getByRole('checkbox')`로 못 잡는다** ([06-react](./06-react.md) 테스트 절의 role 셀렉터
규칙과 직결된다).

```tsx
// GOOD - Base UI Checkbox + label 연결 + react-hook-form
<Field.Root>
  <Checkbox.Root id="terms" checked={field.value} onCheckedChange={field.onChange} />
  <label htmlFor="terms">유의사항을 확인했습니다.</label>
</Field.Root>

// BAD - div/button + svg로 흉내
<button onClick={() => setChecked(!checked)}>{checked && <CheckIcon />}</button>
```

- **레이블을 연결한다.** `htmlFor`/`id`로 묶어 클릭 영역과 스크린리더 라벨을 확보한다.
- **react-hook-form에 결합한다.** `field.value` / `field.onChange`로 상태를 폼에 맡기고,
  컴포넌트 안에 별도 `useState`로 값을 복제하지 않는다.

## 검증 (MUST)

사용자 입력은 zod 스키마로 검증한다. 타입은 스키마에서 파생시킨다
([05-types](./05-types.md)).

```ts
const schema = z.object({
  email: z.email('올바른 이메일을 입력하세요.'),
  password: z.string().min(8, '비밀번호는 8자 이상이어야 합니다.'),
})
type FormValues = z.infer<typeof schema>
```

제출 에러는 `useMutation`의 `onError`에서 폼 에러/토스트로 표시한다 — 조회 에러처럼
바운더리로 올리지 않는다 ([03-api](./03-api.md)).
