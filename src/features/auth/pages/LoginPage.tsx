import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'

import { useLogin } from '@/features/auth/queries/useLogin'
import { type LoginFormValues, loginSchema } from '@/features/auth/schemas/login'
import type { LocationState } from '@/features/auth/types/auth'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { ROUTE_PATH } from '@/shared/constants/routes'
import { getDisplayErrorMessage } from '@/shared/lib/notifyError'
import { useAuthStore } from '@/shared/stores/authStore'

export const LoginPage = () => {
  const status = useAuthStore((state) => {
    return state.status
  })
  const navigate = useNavigate()
  const location = useLocation()

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) })

  // 토큰 저장·스토어 갱신은 useLogin이 한다. 여기서는 화면 전환과 폼 에러만 다룬다.
  const { loginMutation, isLoginPending } = useLogin()

  if (status === 'authenticated') return <Navigate to={ROUTE_PATH.HOME} replace />

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
                loginMutation(values, {
                  onSuccess: () => {
                    const from =
                      (location.state as LocationState | null)?.from?.pathname ?? ROUTE_PATH.HOME
                    void navigate(from, { replace: true })
                  },
                  onError: (error) => {
                    setError('root', { message: getDisplayErrorMessage({ error }) })
                  },
                })
              })(event)
            }}
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">이메일</Label>
              <Input id="email" type="email" autoComplete="email" {...register('email')} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
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

            <Button type="submit" disabled={isLoginPending}>
              로그인
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
