'use client'
import useFormatters from "@/hook/useFormatters";
import React from "react";
import { toast } from "sonner";

import SliderDefault from "@/components/SliderDefault";
import { Button } from "@/components/ui/button";
import CurrencyField from "@/components/ui/current";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

import { BiSolidPhoneCall } from "react-icons/bi";
import { FaMapLocationDot, FaPiggyBank } from "react-icons/fa6";
import { HiSave } from "react-icons/hi";
import { MdUpdate } from "react-icons/md";

import { ConfiguracaoDTO } from "@/dto/configuracaoDTO";
import { api } from "@/service/api";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";

const DIAS = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'];

const schemaEditConfig = z.object({
    tel: z.string().optional().refine((value) => !value || (value.length >= 8 && value.length <= 15), { message: "Telefone inválido", }),
    facebook: z.string().optional().refine((value) => !value || (value.length >= 3 && value.length <= 150), { message: "Facebook inválido", }),
    instagram: z.string().optional().refine((value) => !value || (value.length >= 3 && value.length <= 150), { message: "Instagram inválido", }),
    cashback: z.number().optional().refine((value) => !value || (value >= 0 && value <= 100), { message: "Cashback inválido", }),
    endereco: z.string().optional().refine((value) => !value || (value.length <= 254), { message: "Endereço deve ser mais curto.", }),
    taxaDeEntrega: z.string().optional(),
    intervaloEntrega: z.string().optional(),
    // Validação dos horários de atendimento
    horarioAtendimento: z.record(
        z.object({
            abertura: z.string(),
            fechamento: z.string(),
            inicio_intervalo: z.string(),
            fim_intervalo: z.string(),
        })).optional(),
});
type EditConfigForm = z.infer<typeof schemaEditConfig>
type Props = {}
export default function ViewConfig({ }: Props) {
    const methods = useForm<EditConfigForm>({
        resolver: zodResolver(schemaEditConfig),
        defaultValues: {
            cashback: 10,
            taxaDeEntrega: '5,00',
            intervaloEntrega: '00:30',
            horarioAtendimento: {
                seg: { abertura: '', fechamento: '', inicio_intervalo: '', fim_intervalo: '' },
                ter: { abertura: '', fechamento: '', inicio_intervalo: '', fim_intervalo: '' },
                qua: { abertura: '', fechamento: '', inicio_intervalo: '', fim_intervalo: '' },
                qui: { abertura: '', fechamento: '', inicio_intervalo: '', fim_intervalo: '' },
                sex: { abertura: '', fechamento: '', inicio_intervalo: '', fim_intervalo: '' },
                sab: { abertura: '', fechamento: '', inicio_intervalo: '', fim_intervalo: '' },
                dom: { abertura: '', fechamento: '', inicio_intervalo: '', fim_intervalo: '' },
            }
        }
    })
    const { register, watch, handleSubmit, setValue, formState: { errors } } = methods;
    const { cellPhoneFormat } = useFormatters()
    const tel = watch('tel');

    React.useEffect(() => {
        setValue('tel', cellPhoneFormat(tel || ''));
    }, [tel, setValue, cellPhoneFormat]);

    const { data: configData, isLoading } = useQuery({
        queryKey: ['configAdmin'],
        queryFn: async () => {
            const res = await api.get('/configuracao');
            return res.data;
        },
    });

    const { isPending, ...mutation } = useMutation({
        mutationFn: async ({ cashback, endereco, facebook, instagram, intervaloEntrega, taxaDeEntrega, tel, horarioAtendimento }: EditConfigForm) => {
            const redesSociais = { facebook, instagram };
            const editCashback = { chave: "cashback", valor: (cashback ?? 0).toString(), privado: false };
            const editTelefone = { chave: "telefone", valor: tel, privado: false };
            const editRedesSociais = { chave: "redesSociais", valor: JSON.stringify(redesSociais), privado: false };
            const editEndereco = { chave: "endereco", valor: endereco, privado: false };
            const intervaloEmMinutos = intervaloEntrega ? parseInt(intervaloEntrega.split(':')[0]) * 60 + parseInt(intervaloEntrega.split(':')[1]) : '';
            const editIntervaloEntrega = { chave: "intervaloDeEntrega", valor: intervaloEmMinutos.toString(), privado: false };
            const editTaxaDeEntrega = { chave: "taxaFrete", valor: taxaDeEntrega, privado: false };

            // Cria o objeto para salvar os horários de atendimento
            const editHorarioAtendimento = {
                chave: "horarioAtendimento",
                valor: JSON.stringify(horarioAtendimento), // Converte o objeto para JSON
                privado: false,
            };
            console.log('intervaloEmMinutos', intervaloEmMinutos);

            const requests = [
                api.put<ConfiguracaoDTO>('/configuracao', editCashback)
                    .catch(async (e) => { if (e.response?.status === 404) await api.post<ConfiguracaoDTO>('/configuracao', editCashback); }),
                api.put<ConfiguracaoDTO>('/configuracao', editTelefone)
                    .catch(async (e) => { if (e.response?.status === 404) await api.post<ConfiguracaoDTO>('/configuracao', editTelefone); }),
                api.put<ConfiguracaoDTO>('/configuracao', editRedesSociais)
                    .catch(async (e) => { if (e.response?.status === 404) await api.post<ConfiguracaoDTO>('/configuracao', editRedesSociais); }),
                api.put<ConfiguracaoDTO>('/configuracao', editEndereco)
                    .catch(async (e) => { if (e.response?.status === 404) await api.post<ConfiguracaoDTO>('/configuracao', editEndereco); }),
                api.put<ConfiguracaoDTO>('/configuracao', editIntervaloEntrega)
                    .catch(async (e) => { if (e.response?.status === 404) await api.post<ConfiguracaoDTO>('/configuracao', editIntervaloEntrega); }),
                api.put<ConfiguracaoDTO>('/configuracao', editTaxaDeEntrega)
                    .catch(async (e) => { if (e.response?.status === 404) await api.post<ConfiguracaoDTO>('/configuracao', editTaxaDeEntrega); }),
                api.put<ConfiguracaoDTO>('/configuracao', editHorarioAtendimento)
                    .catch(async (e) => { if (e.response?.status === 404) await api.post<ConfiguracaoDTO>('/configuracao', editHorarioAtendimento); }),
            ];
            await Promise.all(requests);
        },
        onSuccess: () => {
            toast.success("Configurações salvas com sucesso");
        },
        onError: () => {
            toast.error("Erro ao salvar configurações");
        },
    });

    const onSubmit = (data: EditConfigForm) => {
        mutation.mutate(data);
    };

    React.useEffect(() => {
        if (configData) {
            const telField = configData.find((item: any) => item.chave.toUpperCase() === 'TELEFONE')?.valor ?? '';
            const redesSociaisData = configData.find((item: any) => item.chave.toUpperCase() === 'REDESSOCIAIS')?.valor;
            const cashbackField = configData.find((item: any) => item.chave.toUpperCase() === 'CASHBACK')?.valor ?? '0';
            const enderecoField = configData.find((item: any) => item.chave.toUpperCase() === 'ENDERECO')?.valor ?? '';
            const intervaloEntregaField = configData.find((item: any) => item.chave.toUpperCase() === 'INTERVALODEENTREGA')?.valor ?? '0';
            const taxaFreteField = configData.find((item: any) => item.chave.toUpperCase() === 'TAXAFRETE')?.valor ?? '0';
            const horarioAtendimentoField = configData.find((item: any) => item.chave.toUpperCase() === 'HORARIOATENDIMENTO')?.valor ?? '';

            setValue('tel', telField);

            if (redesSociaisData) {
                const { facebook, instagram } = JSON.parse(redesSociaisData);
                setValue('facebook', facebook ?? '');
                setValue('instagram', instagram ?? '');
            }
            console.log('intervaloEntregaField', intervaloEntregaField);

            setValue('cashback', parseFloat(cashbackField));
            setValue('endereco', enderecoField);
            // Converte o valor numérico para o formato HH:MM
            const intervaloEmMinutos = parseFloat(intervaloEntregaField.replace(',', '.'));
            const horas = Math.floor(intervaloEmMinutos / 60);
            const minutos = intervaloEmMinutos % 60;
            const intervaloFormatado = `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`;
            setValue('intervaloEntrega', intervaloFormatado); // Define o valor no formato HH:MM
            setValue('taxaDeEntrega', taxaFreteField);

            // Atualiza os horários de atendimento
            if (horarioAtendimentoField) {
                const horarioAtendimento = JSON.parse(horarioAtendimentoField);
                DIAS.forEach((dia) => {
                    if (horarioAtendimento[dia]) {
                        setValue(`horarioAtendimento.${dia}.abertura`, horarioAtendimento[dia].abertura);
                        setValue(`horarioAtendimento.${dia}.fechamento`, horarioAtendimento[dia].fechamento);
                        setValue(`horarioAtendimento.${dia}.inicio_intervalo`, horarioAtendimento[dia].inicio_intervalo);
                        setValue(`horarioAtendimento.${dia}.fim_intervalo`, horarioAtendimento[dia].fim_intervalo);
                    }
                });
            }
        }
    }, [configData, setValue]);

    return (
        <section className="space-y-2">
            <FormProvider {...methods}>
                <form onSubmit={handleSubmit(onSubmit)}>
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
                                        <Input
                                            type="time"
                                            placeholder="00:00"
                                            className="w-fit"
                                            label="Abertura" {...register(`horarioAtendimento.${dia}.abertura`)}
                                        />
                                        <Input
                                            type="time"
                                            placeholder="00:00"
                                            className="w-fit"
                                            label="Fechamento" {...register(`horarioAtendimento.${dia}.fechamento`)}
                                        />
                                        <Input
                                            type="time"
                                            placeholder="00:00"
                                            className="w-fit"
                                            label="Início Intervalo" {...register(`horarioAtendimento.${dia}.inicio_intervalo`)}
                                        />
                                        <Input
                                            type="time"
                                            placeholder="00:00"
                                            className="w-fit"
                                            label="Final Intervalo" {...register(`horarioAtendimento.${dia}.fim_intervalo`)}
                                        />
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
                                        placeholder="00"
                                        label="Intervalo entre entregas:"
                                        questionContent="Defina o intervalo de tempo entre as entregas realizadas pelo estabelecimento. Ex: 30 minutos."
                                        {...register('intervaloEntrega')}
                                        error={errors.intervaloEntrega?.message}

                                    />
                                    <CurrencyField
                                        name="taxaDeEntrega"
                                        label="Taxa de Frete:"
                                        questionContent="Esse campo indica o valor da taxa de entrega cobrada pelo estabelecimento. EX: R$ 5,00 por km."
                                        error={errors.taxaDeEntrega?.message}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end items-center">
                        <div className="my-4 w-3/12">
                            <Button
                                className="flex items-center gap-1 w-full"
                                variant={'outline'}
                                loading={isPending}
                                type="submit">
                                <HiSave size={20} />
                                Salvar Configurações
                            </Button>
                        </div>
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