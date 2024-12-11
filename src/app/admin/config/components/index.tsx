'use client'
import useFormatters from "@/hook/useFormatters";
import React from "react";

import SliderDefault from "@/components/SliderDefault";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";


import { BiSolidPhoneCall } from "react-icons/bi";
import { FaMapLocationDot, FaPiggyBank } from "react-icons/fa6";
import { HiSave } from "react-icons/hi";
import { MdUpdate } from "react-icons/md";

import CurrencyField from "@/components/ui/current";
import { Separator } from "@/components/ui/separator";
import { api } from "@/service/api";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";
import CashBack from "@/app/cashback/page";
import { ConfiguracaoDTO } from "@/dto/configuracaoDTO";

const DIAS = ['segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado', 'domingo'];

const schemaEditConfig = z.object({
    tel: z.string().optional().refine((value) => !value || (value.length >= 8 && value.length <= 15), {message: "Telefone inválido",}),
    facebook: z.string().optional().refine((value) => !value || (value.length >= 3 && value.length <= 150), {message: "Facebook inválido",}),
    instagram: z.string().optional().refine((value) => !value || (value.length >= 3 && value.length <= 150), {message: "Instagram inválido",}),
    cashback: z.number().optional().refine((value) => !value || (value >= 0 && value <= 100), {message: "Cashback inválido",}),
    endereco: z.string().optional().refine((value) => !value || (value.length <= 254), {message: "Endereço deve ser mais curto.",}),
})
type EditConfigForm = z.infer<typeof schemaEditConfig>

type Props = {

}
export default function ViewConfig({ }: Props) {
    const methods = useForm<EditConfigForm>({
        resolver: zodResolver(schemaEditConfig),
        defaultValues: {
            cashback: 10
        }
    })
    const { register, watch, handleSubmit, setValue, formState: { errors } } = methods;
    const { cellPhoneFormat } = useFormatters()
    const tel = watch('tel');


    const { } = useMutation({
        mutationKey: ['editConfig',],
        mutationFn: async (response: EditConfigForm) => {
            const { data } = await api.post('/configuracao', {
            });
            return data
        }, onSuccess(data, variables, context) {
        }, onError(error, variables, context) {
        },
    })

    React.useEffect(() => {
        setValue('tel', cellPhoneFormat(tel || ''));
    }, [tel, setValue, cellPhoneFormat]);


    const salvarDados = async (data: EditConfigForm) => {
        const facebook = watch('facebook');
        const instagram = watch('instagram');
        const cashback = watch('cashback');
        const endereco = watch('endereco');
        console.log(endereco);
        const redesSociais = { facebook: facebook, instagram: instagram }


        //
        const editCashback = { chave: "cashback", valor: (cashback ?? 0).toString(), privado: false }
        const editTelefone = { chave: "telefone", valor: tel, privado: false }
        const editRedesSociais = { chave: "redesSociais", valor: JSON.stringify(redesSociais), privado: false }

        const requests = [
            api.put<ConfiguracaoDTO>(`/configuracao`, editCashback).catch(async (e) => { if (e.response.status == 404) { await api.post<ConfiguracaoDTO>(`/configuracao`, editCashback) } }),
            api.put<ConfiguracaoDTO>(`/configuracao`, editTelefone).catch(async (e) => { if (e.response.status == 404) { await api.post<ConfiguracaoDTO>(`/configuracao`, editTelefone) } }),
            api.put<ConfiguracaoDTO>(`/configuracao`, editRedesSociais).catch(async (e) => { if (e.response.status == 404) { await api.post<ConfiguracaoDTO>(`/configuracao`, editRedesSociais) } }),
        ]
        Promise.all(requests);
    }

    return (
        <section className="space-y-2">
            <FormProvider {...methods}>
                <form onSubmit={handleSubmit(salvarDados)}>
                    <div className="grid grid-cols-2 gap-2">
                        {/* Horário de Atendimento Section */}
                        <div className="bg-dark-300 p-4  rounded-md">
                            <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
                                <MdUpdate />
                                Horário de Atendimento
                            </h2>
                            <p className="text-xs text-muted">
                                Configure os horários de abertura e
                                fechamento do estabelecimento, bem como os
                                intervalos de atendimento para cada dia
                                da semana. Esta seção permite ajustar os
                                horários de funcionamento de forma detalhada.
                            </p>

                            {DIAS.map((dia) => (
                                <div key={dia} className="flex items-center justify-between border-b py-2  border-muted/20 ">
                                    <h2 className="uppercase mt-6  text-base text-muted tracking-wider">{dia}:</h2>
                                    <div className="grid grid-cols-4 gap-6">
                                        <Input className="w-fit" label="Abertura" questionContent={`Defina o horário de abertura do estabelecimento ${dia !== 'sábado' && dia !== 'domingo' ? 'na' : 'no'} ${dia}`} type="time" />
                                        <Input className="w-fit" label="Fechamento" questionContent={`Defina o horário de fechamento do estabelecimento ${dia !== 'sábado' && dia !== 'domingo' ? 'na' : 'no'} ${dia}`} type="time" />
                                        <Input className="w-fit" label="Início Intervalo" questionContent={`Defina o horário de início do intervalo de atendimento ${dia !== 'sábado' && dia !== 'domingo' ? 'na' : 'no'} ${dia}`} type="time" />
                                        <Input className="w-fit" label="Final Intervalo" questionContent={`Defina o horário de término do intervalo de atendimento ${dia !== 'sábado' && dia !== 'domingo' ? 'na' : 'no'} ${dia}`} type="time" />
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Informações de Contato Section */}
                        <div className="bg-dark-300 p-4 rounded-md flex flex-col">
                            <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
                                <BiSolidPhoneCall />
                                Informações de Contato
                            </h2>
                            <p className="text-xs text-muted pb-3">
                                Forneça os detalhes de contato do estabelecimento,
                                incluindo telefone, Facebook e Instagram. Esta
                                seção permite que os clientes encontrem facilmente
                                as informações necessárias para entrar em contato.
                            </p>

                            <div className="flex flex-col justify-center">
                                <Input
                                    type="tel"
                                    label="Telefone:"
                                    placeholder="(00) 00000-0000"
                                    {...register('tel')}
                                    error={errors.tel?.message}
                                />
                                <Input
                                    type="text"
                                    label="Facebook:"
                                    placeholder="@seu-usuario"
                                    {...register('facebook')}
                                    error={errors.facebook?.message}
                                />
                                <Input
                                    type="text"
                                    label="Instagram:"
                                    placeholder="@seu-usuario"
                                    {...register('instagram')}
                                    error={errors.instagram?.message}
                                />
                            </div>
                            <Separator className="bg-muted/20 mt-4" />
                            {/* Cashback Section */}
                            <div className="my-4">
                                <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
                                    <FaPiggyBank />
                                    Cashback
                                </h2>
                                <p className="text-xs text-muted pb-3">
                                    Configure a porcentagem de cashback que o usuário
                                    receberá em cada compra. Esta seção permite
                                    ajustar a taxa de retorno para incentivar as
                                    compras e fidelizar os clientes.
                                </p>

                                <div className="">
                                    <SliderDefault
                                        name="cashback"
                                        label="Defina a porcentagem de Cashback"
                                        questionContent="Indica a porcentagem de cashback que o usuário receberá em cada compra."
                                        error={errors.cashback?.message}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Informações de Entrega Section */}
                        <div className="bg-dark-300 p-4 rounded-md flex flex-col">
                            <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
                                <FaMapLocationDot />
                                Informações de Entrega
                            </h2>
                            <p className="text-xs text-muted pb-3">
                                Forneça os detalhes de contato do estabelecimento,
                                incluindo telefone, Facebook e Instagram. Esta
                                seção permite que os clientes encontrem facilmente
                                as informações necessárias para entrar em contato.
                            </p>

                            <div className="flex flex-col justify-center">
                                <Input
                                    type="text"
                                    placeholder="Avenida Brasil, 123"
                                    label="Endereço do Estabelecimento:"
                                    questionContent="Este campo será utilizado para calcular o frete e exibir o endereço do estabelecimento."
                                    {...register('endereco')}
                                    error={errors.endereco?.message}
                                />


                                <div className="grid grid-cols-2 gap-2">
                                    <Input
                                        type="time"
                                        placeholder="00:00"
                                        label="Intervalo entre entregas:"
                                        questionContent="Defina o intervalo de tempo entre as entregas realizadas pelo estabelecimento."
                                    />
                                    <CurrencyField
                                        name="cashback"
                                        label="Taxa de Frete:"
                                        questionContent="Esse campo indica o valor da taxa de entrega cobrada pelo estabelecimento. EX: R$ 5,00 por km."
                                        error={errors.cashback?.message}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className=" flex items-center justify-end my-4">
                        <Button
                            className="flex items-center gap-1"
                            variant={'outline'}
                            // onClick={salvarDados}
                            type="submit">
                            <HiSave size={20} />
                            Salvar Configurações
                        </Button>
                    </div>
                </form>
            </FormProvider>
        </section>
    )
}

{/* Horário de Atendimento Section */ }
// <div className="grid grid-cols-2 ">
// <div className="bg-dark-300 p-4  rounded-md ">
//     <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
//         <MdUpdate />
//         Horário de Atendimento
//     </h2>
//     <div className="grid grid-cols-2 gap-2 items-center">
//         <Input label="Abertura" type="time" />
//         <Input label="Fechamento" type="time" />
//     </div>
//     <h3 className="font-semibold my-2">Dias de Funcionamento</h3>
//     <div className="grid grid-cols-3  gap-2 ">
//         {Object.keys(dias).map((dia) => (
//             <div key={dia} className="flex items-center gap-2">
//                 <Checkbox
//                     id={dia}
//                     className="w-5 h-5"
//                     checked={dias[dia]}
//                     onCheckedChange={() => handleCheckboxChange(dia)}
//                 />
//                 <label className="cursor-pointer" htmlFor={dia}>{dia}</label>
//             </div>
//         ))}
//     </div>
//     <div className=" flex flex-col my-3 gap-1 ">
//         <label className="cursor-pointer" htmlFor="temIntervalo">Possui intervalo?</label>
//         <div className="flex items-center gap-2">
//             <Button
//                 size={'sm'}
//                 variant={hasInterval ? 'outline' : 'default'}
//                 className={`${hasInterval ? ' ' : 'text-white-off'}`}
//                 onClick={() => setHasInterval(true)}>
//                 NÃO
//             </Button>
//             <Button
//                 size={'sm'}
//                 variant={hasInterval ? 'default' : 'outline'}
//                 className={`${hasInterval ? ' text-white-off' : ''}`}
//                 onClick={() => setHasInterval(false)} >
//                 SIM
//             </Button>
//         </div>
//     </div>
//     <div className="grid grid-cols-2 gap-2 items-center">
//         <Input
//             type="time"
//             disabled={hasInterval}
//             label="Início do Intervalo:"
//         />
//         <Input
//             type="time"
//             disabled={hasInterval}
//             label="Fim do Intervalo:"
//         />
//     </div>
//     <Button className="w-full mt-4" variant={'outline'}>Salvar Horário</Button>
// </div>
// </div>