"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { toast } from "sonner";
import { api, mostrarErro } from "@/service/api";
import { destinoSeguro, destinoAdmin } from "@/lib/navigation";
import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

const schema = z.object({
  code: z.string().regex(/^\d{6}$/, "Informe os 6 dígitos do código."),
});
export type CodeForm = z.infer<typeof schema>;
const challengeSchema = z.object({
  tel: z.string().regex(/^\d{10,11}$/),
  desafioId: z.string().uuid(),
});

function GetCodeContent() {
  const search = useSearchParams();
  const router = useRouter();
  const tel = search.get("tel") ?? "";
  const desafioId = search.get("desafioId") ?? "";
  const validChallenge = challengeSchema.safeParse({ tel, desafioId }).success;
  const callbackUrl = destinoSeguro(search.get("callbackUrl") ?? "/?firstLogin=true");
  const isAdminAccess = destinoAdmin(callbackUrl);
  const signin = `/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`;
  const form = useForm<CodeForm>({
    resolver: zodResolver(schema),
    defaultValues: { code: "" },
  });
  const [resendAt, setResendAt] = useState(() => {
    const value = Number(search.get("reenviarEm"));
    return value > 0 && Number.isFinite(value)
      ? Math.min(value, Date.now() + 60000)
      : Date.now() + 60000;
  });
  const [now, setNow] = useState(Date.now);
  const time = Math.max(0, Math.ceil((resendAt - now) / 1000));
  const busy = useRef(false);
  const [failed, setFailed] = useState(false);
  const error = (failure: unknown) => {
    setFailed(true);
    mostrarErro(failure);
  };
  const verify = useMutation({
    mutationFn: async ({ code }: CodeForm) =>
      (await api.post("/auth/verify", { code, desafioId, tel: `55${tel}` }))
        .data,
    onSuccess: (data) => {
      toast.success("Código verificado com sucesso!");
      if (isAdminAccess && !data.user.isAdmin) {
        toast.error("Este usuário não tem permissão para acessar o painel.");
        window.location.assign("/");
        return;
      }
      window.location.assign(callbackUrl);
    },
    onError: error,
    onSettled: () => {
      busy.current = false;
    },
  });
  const resend = useMutation({
    mutationFn: async () =>
      (await api.post("/auth/wp", { tel: `55${tel}` })).data,
    onSuccess: (data) => {
      const deadline = Date.now() + 60000;
      const params = new URLSearchParams({
        tel,
        desafioId: data.desafioId,
        callbackUrl,
        reenviarEm: String(deadline),
      });
      // A URL deve acompanhar o desafio novo inclusive após recarregar a página.
      router.replace(`/signin/getcode?${params.toString()}`);
      setResendAt(deadline);
      setNow(Date.now());
      form.reset({ code: "" });
      toast.success(data.message);
      if (data.developmentCode)
        toast.info(`Código de desenvolvimento: ${data.developmentCode}`, {
          duration: 20000,
        });
    },
    onError: error,
    onSettled: () => {
      busy.current = false;
    },
  });
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const pending = verify.isPending || resend.isPending;

  if (!validChallenge)
    return (
      <main className="mx-auto mt-20 max-w-md space-y-4 p-5">
        <h1 className="text-xl font-bold">Solicite um código de acesso</h1>
        <p role="alert">
          Este link está incompleto ou inválido. Informe seu telefone para
          receber um novo código.
        </p>
        <Button asChild>
          <Link href={signin}>Voltar ao login</Link>
        </Button>
      </main>
    );

  return (
    <main className="mx-auto mt-20 max-w-md space-y-5 rounded-lg bg-white p-5">
      <h1 className="text-center text-2xl font-bold">
        {isAdminAccess ? "Código admin" : "Código de acesso"}
      </h1>
      <p className="text-center text-sm">
        Digite o código de 6 dígitos enviado para o telefone terminado em{" "}
        {tel.slice(-4)}.
      </p>
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit((values) => {
          if (busy.current) return;
          busy.current = true;
          setFailed(false);
          verify.mutate(values);
        })}
      >
        <Controller
          control={form.control}
          name="code"
          render={({ field }) => (
            <InputOTP
              {...field}
              aria-label="Código de acesso"
              aria-invalid={!!form.formState.errors.code}
              aria-describedby={
                form.formState.errors.code ? "code-error" : undefined
              }
              containerClassName="justify-center"
              maxLength={6}
              pattern={REGEXP_ONLY_DIGITS}
              inputMode="numeric"
              autoComplete="one-time-code"
              disabled={pending}
            >
              <InputOTPGroup>
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <InputOTPSlot key={index} index={index} />
                ))}
              </InputOTPGroup>
            </InputOTP>
          )}
        />
        {form.formState.errors.code && (
          <p id="code-error" role="alert" className="text-sm text-red-600">
            {form.formState.errors.code.message}
          </p>
        )}
        {failed && (
          <p role="alert" className="text-sm text-red-600">
            Não foi possível concluir. Confira o código e tente novamente ou
            solicite um novo.
          </p>
        )}
        <Button
          type="submit"
          disabled={pending}
          className="w-full"
          variant="success"
        >
          {verify.isPending ? "Verificando…" : "Confirmar código"}
        </Button>
      </form>
      <div className="space-y-3 text-center">
        <p className="text-xs text-muted-foreground">
          {time > 0
            ? `Você poderá solicitar um novo código em ${time} segundos`
            : "Se não recebeu o código, solicite um novo."}
        </p>
        <Button
          type="button"
          variant="outline"
          disabled={pending || time > 0}
          className="w-full"
          onClick={() => {
            if (busy.current || time > 0) return;
            busy.current = true;
            setFailed(false);
            resend.mutate();
          }}
        >
          {resend.isPending ? "Enviando…" : "Reenviar código"}
        </Button>
        <Link className="block text-sm underline" href={signin}>
          Alterar telefone
        </Link>
      </div>
      {isAdminAccess && (
        <p className="text-xs">
          O acesso ao painel depende da permissão administrativa da sua conta.
        </p>
      )}
    </main>
  );
}

export default function GetCode() {
  return (
    <Suspense fallback={<p role="status">Carregando…</p>}>
      <GetCodeContent />
    </Suspense>
  );
}
