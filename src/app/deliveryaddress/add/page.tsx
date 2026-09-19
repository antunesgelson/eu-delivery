 'use client';
import { Suspense } from "react";
import CompleteAddress from './components/CompleteAddress';
import { LocationDTO } from '@/dto/addressDTO';
export default function AddAddress(){return <Suspense fallback={<main className="mt-16 p-4" role="status">Carregando formulário…</main>}><CompleteAddress location={{} as LocationDTO}/></Suspense>;}
