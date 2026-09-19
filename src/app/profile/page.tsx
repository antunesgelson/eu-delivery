"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { api, mostrarErro } from "@/service/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { motion } from "framer-motion";
import { useCallback, useEffect, useRef } from "react";
import { MdSaveAlt } from "react-icons/md";
import { toast } from "sonner";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { ProfileSchema, ProfileForm } from "./schema";

import { UserDTO } from "@/dto/userDTO";
import useFormatters from "@/hook/useFormatters";

export type { ProfileForm } from "./schema";

export default function Profile() {
  const { cpfFormat, cellPhoneFormat, homePhoneFormat } = useFormatters();
  const client = useQueryClient();
  const sending = useRef(false);
  const {
    handleSubmit,
    reset,
    register,
    setValue,
    watch,
    formState: { errors, dirtyFields },
  } = useForm<ProfileForm>({
    resolver: zodResolver(ProfileSchema),
    defaultValues: {
      nome: "",
      telefone: "",
      email: "",
      aniversario: "",
      cpf: "",
    },
  });
  const cpf = watch("cpf");
  const toForm = useCallback(
    (user: UserDTO): ProfileForm => {
      const phone = (user.tel ?? "").replace(/^55(?=\d{10,11}$)/, "");
      return {
        nome: user.nome ?? "",
        telefone:
          phone.length === 10 ? homePhoneFormat(phone) : cellPhoneFormat(phone),
        email: user.email ?? "",
        aniversario: user.dataDeNascimento?.slice(0, 10) ?? "",
        cpf: cpfFormat(user.cpf ?? ""),
      };
    },
    [cellPhoneFormat, homePhoneFormat, cpfFormat],
  );
  const profile = useQuery<UserDTO>({
    queryKey: ["profile"],
    queryFn: async ({ signal }) => (await api.get("/usuario", { signal })).data,
    retry: false,
  });
  const { mutate: handleEditUser, isPending } = useMutation({
    mutationFn: async ({ email, nome, aniversario, cpf }: ProfileForm) => {
      await client.cancelQueries({ queryKey: ["profile"] });
      return (
        await api.put<UserDTO>("/usuario", {
          nome: nome.trim(),
          cpf: cpf?.replace(/\D/g, "") ?? "",
          email: email.trim() || null,
          dataDeNascimento: aniversario || null,
        })
      ).data;
    },
    onSuccess: async (data) => {
      reset(toForm(data));
      client.setQueryData(["profile"], data);
      await client.invalidateQueries({ queryKey: ["sessao"] });
      toast.success("Perfil atualizado com sucesso.");
    },
    onError: mostrarErro,
    onSettled: () => {
      sending.current = false;
    },
  });
  useEffect(() => {
    if (!profile.data) return;
    // Revalidações atualizam campos intactos e preservam o que está sendo editado.
    reset(toForm(profile.data), { keepDirtyValues: true });
  }, [profile.data, reset, toForm]);
  useEffect(() => {
    if (cpf) setValue("cpf", cpfFormat(cpf));
  }, [cpf, setValue, cpfFormat]);
  if (profile.isPending)
    return (
      <main className="mt-16 p-4" role="status">
        Carregando perfil…
      </main>
    );
  if (profile.isError && !profile.data)
    return (
      <main className="mt-16 p-4" role="alert">
        Não foi possível carregar seu perfil.{" "}
        <Button
          disabled={profile.isFetching}
          onClick={() => void profile.refetch()}
        >
          Tentar novamente
        </Button>
      </main>
    );

  return (
    <motion.main
      className="mt-12"
      initial={{ opacity: 0, y: 100, filter: "blur(10px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
    >
      <div className="p-4 leading-3">
        <h2 className="uppercase text-2xl font-bold ">minhas informações</h2>
        <span className="text-[12px]">
          Aqui você pode atualizar e corrigir suas informações sempre que
          precisar.
        </span>
      </div>

      <section className="bg-white p-4">
        {profile.isError && (
          <div role="alert" className="mb-4 space-y-2">
            <p>
              Não foi possível atualizar seu perfil. Suas alterações foram
              preservadas. Tente novamente antes de salvar.
            </p>
            <Button
              disabled={profile.isFetching}
              onClick={() => void profile.refetch()}
            >
              Tentar novamente
            </Button>
          </div>
        )}
        <form
          noValidate
          onSubmit={handleSubmit((data) => {
            if (sending.current || profile.isError) return;
            sending.current = true;
            handleEditUser(data);
          })}
          className="space-y-3"
        >
          <fieldset disabled={isPending} className="space-y-3">
            <div>
              <Label htmlFor="nome" className="uppercase">
                nome
              </Label>
              <Input
                id="nome"
                {...register("nome")}
                error={errors.nome?.message}
              />
            </div>
            <div>
              <Label htmlFor="telefone" className="uppercase">
                telefone
              </Label>
              <Input
                type="tel"
                readOnly
                placeholder="(00) 00000-0000"
                id="telefone"
                {...register("telefone")}
                error={errors.telefone?.message}
              />
              <p className="text-[11px] leading-3 text-muted-foreground my-1">
                Este é o número verificado no login.
              </p>
            </div>
            <div>
              <Label htmlFor="email" className="uppercase">
                email
              </Label>
              <Input
                type="email"
                id="email"
                {...register("email")}
                error={errors.email?.message}
              />
              <p className="text-[11px] leading-3 text-muted-foreground my-1">
                Fique tranquilo. Não enviamos spam e nunca compartilharemos seu
                email com ninguém.
              </p>
            </div>
            <div>
              <Label htmlFor="aniversario" className="uppercase">
                aniversário <span className="text-muted">(opcional)</span>
              </Label>
              <Input
                type="date"
                placeholder="DD/MM/AAAA"
                id="aniversario"
                {...register("aniversario")}
                error={errors.aniversario?.message}
              />
              <p className="text-[11px] leading-3 text-muted-foreground my-1">
                Quem sabe você recebe um presentinho da gente! =]
              </p>
            </div>
            <div>
              <Label htmlFor="cpf" className="uppercase">
                cpf <span className="text-muted">(opcional)</span>
              </Label>
              <Input
                placeholder="000.000.000-00"
                id="cpf"
                {...register("cpf")}
                error={errors.cpf?.message}
              />
              <p className="text-[11px] leading-3 text-muted-foreground my-1">
                Informe apenas se desejar associar o CPF ao cadastro.
              </p>
            </div>
            <Button
              type="submit"
              disabled={isPending || profile.isError}
              className="w-full flex items-center gap-1"
              variant={"success"}
            >
              {isPending ? "Salvando alterações…" : "Salvar Alterações"}
              <MdSaveAlt size={20} />
            </Button>
          </fieldset>
          {Object.keys(dirtyFields).length > 0 && (
            <p className="text-sm text-muted-foreground">
              Alterações não salvas.
            </p>
          )}
        </form>
      </section>
    </motion.main>
  );
}
