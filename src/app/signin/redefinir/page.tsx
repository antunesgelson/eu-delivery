'use client';
import { Suspense,useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { api,mostrarErro } from '@/service/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
const schema=z.object({email:z.string().email()});
const resetSchema=z.object({senha:z.string().min(12,'Use pelo menos 12 caracteres.').max(128),confirmacao:z.string()}).refine(d=>d.senha===d.confirmacao,{path:['confirmacao'],message:'As senhas precisam ser iguais.'});
function Formulario(){
 const search=useSearchParams(),token=search.get('token'),desafioId=search.get('desafioId');const [message,setMessage]=useState('');
 const forgot=useForm<z.infer<typeof schema>>({resolver:zodResolver(schema)}),reset=useForm<z.infer<typeof resetSchema>>({resolver:zodResolver(resetSchema)});
 const mutation=useMutation({mutationFn:async(data:unknown)=>(await api.post(token?'/auth/redefinir-senha':'/auth/esqueci-senha',data)).data,onSuccess:d=>setMessage(d.message),onError:mostrarErro});
 return <main className="mx-auto mt-20 max-w-md space-y-4 p-5"><h1 className="text-xl font-bold">{token?'Definir nova senha':'Recuperar senha'}</h1>{message?<p role="status">{message}</p>:token?<form className="space-y-4" onSubmit={reset.handleSubmit(({senha})=>mutation.mutate({senha,token,desafioId}))}><Input type="password" placeholder="Nova senha" {...reset.register('senha')}/><p>{reset.formState.errors.senha?.message}</p><Input type="password" placeholder="Confirme a senha" {...reset.register('confirmacao')}/><p>{reset.formState.errors.confirmacao?.message}</p><Button disabled={mutation.isPending}>Salvar senha</Button></form>:<form className="space-y-4" onSubmit={forgot.handleSubmit(d=>mutation.mutate(d))}><Input type="email" placeholder="E-mail" {...forgot.register('email')}/><Button disabled={mutation.isPending}>Enviar instruções</Button></form>}<Link href="/signin">Voltar ao login</Link></main>;
}
export default function Redefinir(){return <Suspense fallback={<p>Carregando…</p>}><Formulario/></Suspense>;}
