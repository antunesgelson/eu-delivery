"use client";

import { Suspense, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { isAxiosError } from "axios";
import { api, mostrarErro } from "@/service/api";
import { destinoSeguro } from "@/lib/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const emailSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Informe um e-mail válido.")
    .max(255, "Use até 255 caracteres."),
});
const senhaSchema = z
  .object({
    senha: z
      .string()
      .min(12, "Use pelo menos 12 caracteres.")
      .max(128, "Use até 128 caracteres."),
    confirmacao: z.string(),
  })
  .refine((data) => data.senha === data.confirmacao, {
    path: ["confirmacao"],
    message: "As senhas precisam ser iguais.",
  });
const linkSchema = z.object({
  desafioId: z.string().uuid(),
  token: z.string().min(64).max(128),
});
export type RecuperarSenhaForm = z.infer<typeof emailSchema>;
export type RedefinirSenhaForm = z.infer<typeof senhaSchema>;

function Formulario() {
  const search = useSearchParams();
  const resetting = search.has("token") || search.has("desafioId");
  const link = linkSchema.safeParse({
    token: search.get("token"),
    desafioId: search.get("desafioId"),
  });
  const callback = destinoSeguro(search.get("callbackUrl"), "/admin/dashboard");
  const recoveryUrl = `/signin/redefinir?callbackUrl=${encodeURIComponent(callback)}`;
  const loginUrl = `/signin?callbackUrl=${encodeURIComponent(callback)}`;
  const [done, setDone] = useState(false);
  const [rejected, setRejected] = useState(false);
  const lock = useRef(false);
  const forgot = useForm<RecuperarSenhaForm>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "" },
  });
  const reset = useForm<RedefinirSenhaForm>({
    resolver: zodResolver(senhaSchema),
    defaultValues: { senha: "", confirmacao: "" },
  });
  const mutation = useMutation({
    mutationFn: async (
      data:
        | RecuperarSenhaForm
        | (z.infer<typeof linkSchema> & { senha: string }),
    ) =>
      api.post(
        resetting ? "/auth/redefinir-senha" : "/auth/esqueci-senha",
        data,
      ),
    onSuccess: () => {
      if (resetting) {
        window.dispatchEvent(new Event("zanini:signout"));
        reset.reset();
      }
      setDone(true);
    },
    onError: (error) => {
      if (resetting && isAxiosError(error) && error.response?.status === 400)
        setRejected(true);
      else mostrarErro(error);
    },
    onSettled: () => {
      lock.current = false;
    },
  });
  const invalid = resetting && (!link.success || rejected);
  const submit = (data: Parameters<typeof mutation.mutate>[0]) => {
    if (lock.current) return;
    lock.current = true;
    mutation.mutate(data);
  };

  return (
    <main className="mx-auto mt-20 max-w-md space-y-4 p-5">
      <h1 className="text-xl font-bold">
        {resetting ? "Definir nova senha" : "Recuperar senha"}
      </h1>
      {done ? (
        <p role="status">
          {resetting
            ? "Senha atualizada. Entre novamente com sua nova senha."
            : "Se o e-mail estiver cadastrado, você receberá as instruções."}
        </p>
      ) : invalid ? (
        <div role="alert" className="space-y-3">
          <p>
            Este link está incompleto, inválido ou expirado. Solicite novas
            instruções para redefinir sua senha.
          </p>
          <Button asChild>
            <Link href={recoveryUrl}>Solicitar novo link</Link>
          </Button>
        </div>
      ) : resetting ? (
        <form
          noValidate
          className="space-y-4"
          onSubmit={reset.handleSubmit(({ senha }) => {
            if (link.success) submit({ ...link.data, senha });
          })}
        >
          <Input
            type="password"
            label="Nova senha"
            aria-label="Nova senha"
            autoComplete="new-password"
            disabled={mutation.isPending}
            {...reset.register("senha")}
            error={reset.formState.errors.senha?.message}
          />
          <Input
            type="password"
            label="Confirme a senha"
            aria-label="Confirme a senha"
            autoComplete="new-password"
            disabled={mutation.isPending}
            {...reset.register("confirmacao")}
            error={reset.formState.errors.confirmacao?.message}
          />
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Salvando senha…" : "Salvar senha"}
          </Button>
        </form>
      ) : (
        <form
          noValidate
          className="space-y-4"
          onSubmit={forgot.handleSubmit(submit)}
        >
          <Input
            type="email"
            label="E-mail"
            aria-label="E-mail"
            autoComplete="email"
            disabled={mutation.isPending}
            {...forgot.register("email")}
            error={forgot.formState.errors.email?.message}
          />
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Enviando instruções…" : "Enviar instruções"}
          </Button>
        </form>
      )}
      <Link className="block" href={loginUrl}>
        Voltar ao login
      </Link>
    </main>
  );
}

function Conteudo() {
  const search = useSearchParams();
  // Cada novo link deve começar sem o resultado ou erro do desafio anterior.
  return <Formulario key={search.toString()} />;
}
export default function Redefinir() {
  return (
    <Suspense fallback={<p role="status">Carregando…</p>}>
      <Conteudo />
    </Suspense>
  );
}
