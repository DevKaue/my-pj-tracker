import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState, type FocusEvent, type FormEvent } from "react";
import { useForm } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import {
  formatDocument,
  isValidEmail,
  normalizeDocument,
  isDocumentIdentifier,
} from "@/lib/validators";
import { SupabaseAuthError } from "@/lib/supabaseAuth";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

const loginSchema = z.object({
  identifier: z
    .string()
    .min(1, "Informe CPF, CNPJ ou email.")
    .refine((value) => isValidEmail(value) || isDocumentIdentifier(value), {
      message: "Informe CPF, CNPJ ou email válido.",
    }),
  password: z.string().min(8, "A senha precisa ter ao menos 8 caracteres."),
});

const registerSchema = z
  .object({
    document: z
      .string()
      .min(1, "Informe CPF ou CNPJ.")
      .refine((value) => isDocumentIdentifier(value), {
        message: "Informe um CPF ou CNPJ válido.",
      }),
    email: z.string().email("Informe um e-mail válido."),
    password: z.string().min(8, "A senha precisa ter ao menos 8 caracteres."),
    confirmPassword: z.string().min(8, "Confirme a senha."),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "As senhas precisam coincidir.",
    path: ["confirmPassword"],
  });

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function LoginPage() {
  const {
    signIn,
    signUp,
    user,
    loading: authLoading,
    resendConfirmation,
  } = useAuth();
  const { toast } = useToast();

  const navigate = useNavigate();
  const location = useLocation();

  const from =
    (location.state as { from?: { pathname: string } })?.from?.pathname || "/";
  const [mode, setMode] = useState<"login" | "register">("login");

  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [lastIdentifier, setLastIdentifier] = useState<string>("");
  const [signupCooldownUntil, setSignupCooldownUntil] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const signupCooldownSeconds = signupCooldownUntil
    ? Math.max(0, Math.ceil((signupCooldownUntil - currentTime) / 1000))
    : 0;

  useEffect(() => {
    if (!authLoading && user) {
      navigate("/", { replace: true });
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!signupCooldownUntil) {
      setCurrentTime(Date.now());
      return;
    }

    const interval = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [signupCooldownUntil]);

  useEffect(() => {
    if (signupCooldownUntil && currentTime >= signupCooldownUntil) {
      setSignupCooldownUntil(null);
    }
  }, [signupCooldownUntil, currentTime]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const {
    register: registerRegister,
    handleSubmit: handleRegisterSubmit,
    formState: { errors: registerErrors, isSubmitting: registerSubmitting },
    setValue: setRegisterValue,
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (values: LoginFormValues) => {
    setNeedsConfirmation(false);
    setLastIdentifier(values.identifier);

    try {
      await signIn(values.identifier, values.password);
      navigate(from, { replace: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";

      if (
        msg.toLowerCase().includes("não foi confirmado") ||
        msg.toLowerCase().includes("not confirmed")
      ) {
        setNeedsConfirmation(true);
      }
    }
  };

  const onRegister = async (values: RegisterFormValues) => {
    try {
      const needsEmailConfirmation = await signUp(
        values.email.trim().toLowerCase(),
        values.password,
        normalizeDocument(values.document),
      );

      if (needsEmailConfirmation) {
        // Email confirmation is required — show clear instructions
        toast({
          title: "Verifique seu e-mail",
          description:
            `Enviamos um link de confirmação para ${values.email.trim().toLowerCase()}. Abra o e-mail e clique no link para ativar sua conta, depois volte aqui e faça login.`,
        });
        setLastIdentifier(values.email.trim().toLowerCase());
        setNeedsConfirmation(true);
        setMode("login");
      } else {
        // No confirmation needed — go straight to dashboard
        toast({
          title: "Conta criada com sucesso!",
          description: "Bem-vindo ao PJ Manager.",
        });
        navigate(from, { replace: true });
      }
    } catch (error) {
      if (
        error instanceof SupabaseAuthError &&
        typeof error.retryAfterSeconds === "number" &&
        error.retryAfterSeconds > 0
      ) {
        setSignupCooldownUntil(Date.now() + error.retryAfterSeconds * 1000);
      }
      // toast já é exibido pelo hook
    }
  };

  const documentField = registerRegister("document");

  const handleDocumentInput = (event: FormEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const digits = input.value.replace(/\D/g, "").slice(0, 14);

    if (digits !== input.value) {
      input.value = digits;
      setRegisterValue("document", digits, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  };

  const handleDocumentBlur = (event: FocusEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const formatted = formatDocument(input.value);
    input.value = formatted;
    setRegisterValue("document", formatted, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  const handleDocumentInputEvent = (event: FormEvent<HTMLInputElement>) => {
    // ✅ RHF: usa onChange (é o que existe no retorno do register)
    documentField.onChange(event);
    handleDocumentInput(event);
  };

  const handleDocumentBlurEvent = (event: FocusEvent<HTMLInputElement>) => {
    documentField.onBlur(event);
    handleDocumentBlur(event);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background transition-colors duration-300">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-lg px-4 py-12">
        <div className="overflow-hidden rounded-3xl border border-border bg-card p-8 shadow-2xl shadow-foreground/5">
          <div className="space-y-2 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-muted-foreground">
              PJ Manager
            </p>
            <h1 className="text-3xl font-semibold text-foreground">
              {mode === "login" ? "Entrar" : "Criar conta"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {mode === "login"
                ? "Acesse seus projetos com CPF, CNPJ ou e-mail e uma senha segura."
                : "Informe CPF/CNPJ, e-mail comercial e crie uma senha exclusiva para começar."}
            </p>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-1 rounded-full bg-muted p-1 text-center text-sm font-semibold text-muted-foreground">
            <button
              type="button"
              className={`rounded-full py-2 transition ${mode === "login" ? "bg-background text-foreground shadow-inner" : ""}`}
              onClick={() => setMode("login")}
            >
              Entrar
            </button>
            <button
              type="button"
              className={`rounded-full py-2 transition ${mode === "register" ? "bg-background text-foreground shadow-inner" : ""}`}
              onClick={() => setMode("register")}
            >
              Criar conta
            </button>
          </div>

          {mode === "login" ? (
            <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5">
              <div className="space-y-1">
                <Label htmlFor="identifier">CPF, CNPJ ou email</Label>
                <Input
                  id="identifier"
                  {...register("identifier")}
                  placeholder="ex.: 123.456.789-00 ou contato@empresa.com"
                />
                {errors.identifier && (
                  <p className="text-xs text-destructive">
                    {errors.identifier.message}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  {...register("password")}
                  placeholder="••••••••"
                />
                {errors.password && (
                  <p className="text-xs text-destructive">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting || authLoading}
                size="lg"
              >
                {isSubmitting || authLoading ? "Entrando..." : "Entrar"}
              </Button>

              {needsConfirmation && (
                <div className="rounded-xl border border-border bg-muted p-4">
                  <p className="text-sm text-muted-foreground">
                    Seu e-mail ainda não foi confirmado. Verifique sua caixa de
                    entrada (e spam).
                  </p>

                  <Button
                    type="button"
                    variant="secondary"
                    className="mt-3 w-full"
                    onClick={async () => {
                      try {
                        await resendConfirmation(lastIdentifier);
                      } catch {
                        // toast já é exibido no hook
                      }
                    }}
                  >
                    Reenviar e-mail de confirmação
                  </Button>
                </div>
              )}
            </form>
          ) : (
            <form
              onSubmit={handleRegisterSubmit(onRegister)}
              className="mt-6 space-y-5"
            >
              <div className="space-y-1">
                <Label htmlFor="document">CPF ou CNPJ</Label>
                <Input
                  id="document"
                  {...documentField}
                  placeholder="ex.: 123.456.789-00 ou 12.345.678/0001-00"
                  inputMode="numeric"
                  maxLength={18}
                  onInput={handleDocumentInputEvent}
                  onBlur={handleDocumentBlurEvent}
                />
                {registerErrors.document && (
                  <p className="text-xs text-destructive">
                    {registerErrors.document.message}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Somente números: CPF = 11 dígitos, CNPJ = 14 dígitos.
                </p>
              </div>

              <div className="space-y-1">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  {...registerRegister("email")}
                  placeholder="contato@empresa.com"
                />
                {registerErrors.email && (
                  <p className="text-xs text-destructive">
                    {registerErrors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="password-register">Senha</Label>
                <Input
                  id="password-register"
                  type="password"
                  {...registerRegister("password")}
                  placeholder="••••••••"
                />
                {registerErrors.password && (
                  <p className="text-xs text-destructive">
                    {registerErrors.password.message}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="confirm-password">Confirme a senha</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  {...registerRegister("confirmPassword")}
                  placeholder="••••••••"
                />
                {registerErrors.confirmPassword && (
                  <p className="text-xs text-destructive">
                    {registerErrors.confirmPassword.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={registerSubmitting || authLoading || signupCooldownSeconds > 0}
                size="lg"
              >
                {registerSubmitting || authLoading
                  ? "Criando conta..."
                  : "Criar conta"}
              </Button>
              {signupCooldownSeconds > 0 && (
                <p className="mt-2 text-center text-xs text-destructive">
                  Aguarde {signupCooldownSeconds}s antes de tentar novamente.
                </p>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
