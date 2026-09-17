 'use client';
import CompleteAddress from './components/CompleteAddress';
import { LocationDTO } from '@/dto/addressDTO';
export default function AddAddress(){return <CompleteAddress location={{} as LocationDTO}/>;}
