import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Navigate, useNavigate } from 'react-router-dom'

import { usePatchLogin } from '@/features/auth/queries/usePatchLogin'
import { type LoginFormValues, loginSchema } from '@/features/auth/schemas/login'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { ROUTE_PATH } from '@/shared/constants/routes'
import { hasStoredSession } from '@/shared/lib/authSession'
import { getDisplayErrorMessage } from '@/shared/lib/notifyError'
import { useAuthStore } from '@/shared/stores/authStore'

/**
 * 인트로(로그인) 화면. 레거시 `/intro`에 해당한다.
 *
 * 지금은 아이디·비밀번호 제출과 토큰 저장까지만 동작한다. 레거시 마크업·문구,
 * 에러코드별 모달·이동(`RESIDENT_NOT_APPROVED` → `/login/pending`,
 * `oldResidentFlag` → `/versionOne/terms`), 로그인 후 단지 정보 적재는
 * `docs/migration/features/auth.md` A1을 기준으로 이어서 붙인다.
 */
export const LoginPage = () => {
  // 단지 컨텍스트가 채워지면(로그인 성공) 리렌더돼 메인으로 넘어간다.
  useAuthStore((state) => {
    return state.aptInfo
  })
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) })

  // 토큰 저장·플래그 정리는 usePatchLogin이 한다. 여기서는 화면 전환과 폼 에러만 다룬다.
  const { patchLoginMutation, isPatchLoginPending } = usePatchLogin()

  if (hasStoredSession()) return <Navigate to={ROUTE_PATH.MAIN} replace />

  return (
    <div className="flex min-h-dvh items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          {/* shadcn CardTitle은 div라서 heading 시맨틱이 없다.
              로그인은 페이지 제목이므로 스크린리더가 인식하도록 role을 준다. */}
          <CardTitle role="heading" aria-level={1}>
            로그인
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="flex flex-col gap-4"
            onSubmit={(event) => {
              void handleSubmit((values) => {
                patchLoginMutation(values, {
                  onSuccess: () => {
                    void navigate(ROUTE_PATH.MAIN, { replace: true })
                  },
                  onError: (error) => {
                    setError('root', { message: getDisplayErrorMessage({ error }) })
                  },
                })
              })(event)
            }}
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor="id">휴대폰 번호</Label>
              <Input id="id" type="tel" autoComplete="username" {...register('id')} />
              {errors.id && <p className="text-xs text-destructive">{errors.id.message}</p>}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                {...register('password')}
              />
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>

            {errors.root && <p className="text-xs text-destructive">{errors.root.message}</p>}

            <Button type="submit" disabled={isPatchLoginPending}>
              로그인
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
