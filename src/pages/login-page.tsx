import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useLocation, useNavigate } from "react-router-dom"
import { Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { useAuth } from "@/components/auth-provider"

const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
})

type LoginValues = z.infer<typeof loginSchema>

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [showPassword, setShowPassword] = useState(false)
  const [authError, setAuthError] = useState(false)
  const [isPending, setIsPending] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
  })

  async function onSubmit(values: LoginValues) {
    setIsPending(true)
    await new Promise((resolve) => setTimeout(resolve, 600))

    const success = login(values.email, values.password)
    if (success) {
      const state = location.state as { from?: { pathname?: string } } | null
      navigate(state?.from?.pathname ?? "/dashboard", { replace: true })
    } else {
      setAuthError(true)
      setIsPending(false)
    }
  }

  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden bg-background p-4">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, var(--border) 1px, transparent 0)",
          backgroundSize: "28px 28px",
          maskImage: "radial-gradient(ellipse 60% 50% at 50% 40%, black 30%, transparent 75%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-[-12rem] left-1/2 h-[28rem] w-[36rem] -translate-x-1/2 rounded-full bg-foreground/[0.06] blur-3xl"
      />

      <Card className="relative w-full max-w-sm animate-in fade-in slide-in-from-bottom-4 shadow-xl shadow-black/5 duration-500 dark:shadow-black/30">
        <CardHeader className="flex flex-col items-center gap-2 pt-6 pb-1 text-center">
          <img src="/hobinh-logo.png" alt="Hobinh" className="h-10 w-auto dark:invert" />
          <div className="flex flex-col gap-0.5">
            <h1 className="font-heading text-lg font-semibold">Admin Panel</h1>
            <p className="text-sm text-muted-foreground">Sign in to manage your store.</p>
          </div>
          <hr className="mt-0.5 w-16 border-t border-dotted border-border" />
        </CardHeader>

        <CardContent className="pt-3 pb-6">
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <FieldGroup className="gap-4">
              <Field data-invalid={!!errors.email}>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <div className="relative">
                  <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    autoComplete="username"
                    placeholder="you@company.com"
                    aria-invalid={!!errors.email}
                    className="pl-9"
                    readOnly={isPending}
                    {...register("email", { onChange: () => setAuthError(false) })}
                  />
                </div>
                <FieldError errors={[errors.email]} />
              </Field>

              <Field data-invalid={!!errors.password}>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <div className="relative">
                  <Lock className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    aria-invalid={!!errors.password}
                    className="pr-9 pl-9"
                    readOnly={isPending}
                    {...register("password", { onChange: () => setAuthError(false) })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    <span className="sr-only">Toggle password visibility</span>
                  </button>
                </div>
                <FieldError errors={[errors.password]} />
              </Field>

              {authError && (
                <p role="alert" className="animate-in fade-in text-sm text-destructive">
                  Invalid email or password.
                </p>
              )}
            </FieldGroup>

            <Button
              type="submit"
              className="w-full shadow-md shadow-black/10 transition-shadow hover:shadow-lg hover:shadow-black/15 disabled:opacity-100 dark:shadow-none"
              disabled={isPending}
            >
              {isPending && <Loader2 className="size-4 animate-spin" />}
              {isPending ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <p className="absolute bottom-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Hobinh — Your Trusted Place
      </p>
    </div>
  )
}
