'use client'
import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { FaLocationDot } from "react-icons/fa6";
import { IoIosArrowRoundForward, IoMdLocate } from "react-icons/io";
import { MdAddLocationAlt, MdEditLocationAlt, MdNotListedLocation } from "react-icons/md";

import { Autocomplete, GoogleMap, LoadScript, Marker } from '@react-google-maps/api';

import { LocationDTO } from "@/dto/addressDTO";
import { api } from "@/service/api";
import { useMutation } from "@tanstack/react-query";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import zod, { z } from "zod";


const AddAdress = () => {
    const [step, setStep] = useState(1);
    const [location, setLocation] = useState<LocationDTO>({} as LocationDTO);

    return (
        <>
            {step === 1 &&
                <SearchLocation
                    setStep={setStep}
                    setLocation={setLocation}
                />}
            {step === 2 && location &&
                <ConfirmLocation
                    setStep={setStep}
                    location={location}
                    setLocation={setLocation}
                />}
            {step === 3 &&
                <CompleteAddress
                    location={location}
                />
            }
        </>
    )
}


// Procurar endereço
type SearchLocationProps = {
    setLocation: (location: LocationDTO) => void;
    setStep: (step: number) => void;
}

const SearchLocation = ({ setLocation, setStep }: SearchLocationProps) => {
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY as string;
    const [loading, setLoading] = useState(false);
    const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);

    const handlePlaceChanged = () => {
        if (autocompleteRef.current) {
            const place = autocompleteRef.current.getPlace();
            if (place.geometry?.location) {
                const location = {
                    lat: place.geometry.location.lat(),
                    lng: place.geometry.location.lng(),
                };
                setLocation(location);
                setStep(2);
            }
        }
    };

    const handleGetCurrentLocation = () => {
        setLoading(true);
        const MIN_LOADING_TIME = 2000; // Tempo mínimo de carregamento em milissegundos
        const startTime = Date.now();

        const success = (position: GeolocationPosition) => {
            const { latitude, longitude } = position.coords;
            setLocation({ lat: latitude, lng: longitude });

            const elapsedTime = Date.now() - startTime;
            const remainingTime = MIN_LOADING_TIME - elapsedTime;

            setTimeout(() => {
                setLoading(false);
                setStep(2);
            }, remainingTime > 0 ? remainingTime : 0);
        };

        const error = () => {
            toast.error("Não foi possível obter a localização.");
            setLoading(false);
            setStep(1);
        };

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(success, error, {
                enableHighAccuracy: true,
                maximumAge: 10000,
                timeout: 5000,
            });
        } else {
            toast.error("Geolocalização não é suportada neste navegador.");
            setLoading(false);
        }
    };

    useEffect(() => {
        if (autocompleteRef.current && inputRef.current) {
            autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
                componentRestrictions: { country: 'BR' },
            });
            autocompleteRef.current.addListener("place_changed", handlePlaceChanged);
        }
    }, []);

    return (
        <motion.main className="mt-12"
            initial={{ opacity: 0, x: 100, filter: 'blur(10px)' }}
            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}>
            <div className='p-4 leading-3'>
                <h2 className="uppercase text-2xl font-bold flex items-center gap-1"><MdAddLocationAlt size={25} />Cadastrar Endereço</h2>
                <span className='text-[12px]'>
                    Busque o endereço já com o número junto para obter um resultado mais preciso.
                </span>
            </div>

            <section className="bg-white p-4 flex flex-col justify-between">
                <div>
                    <Label className="uppercase" htmlFor="terms">Buscar Endereço e Número</Label>
                    <LoadScript
                        googleMapsApiKey={key}
                        libraries={['places']}>
                        <Autocomplete
                            onLoad={ref => autocompleteRef.current = ref}
                            onPlaceChanged={handlePlaceChanged}
                            options={{
                                componentRestrictions: { country: 'BR' }
                            }}>
                            <Input
                                ref={inputRef}
                                id="autoComplete"
                                type="search"
                                placeholder="Ex: Rua sete de Setembro, 332, Centro"
                            />
                        </Autocomplete>
                    </LoadScript>
                </div>
                <div className="flex justify-center my-4">
                    <Button
                        loading={loading}
                        variant={'success'}
                        onClick={handleGetCurrentLocation}
                        className="w-full flex items-center gap-1">
                        <IoMdLocate size={20} />
                        Usar minha localização atual
                    </Button>
                </div>
                <div className="text-muted-foreground text-xs">
                    <strong>Dica: </strong>
                    <span>Busque o endereço já com número junto para obter um resultado mais preciso.</span>
                </div>
            </section>
        </motion.main>
    );
};




const CONTAINER_STYLE = {
    width: '100%',
    height: '300px'
};
// Confirmar endereço
type ConfirmLocationProps = {
    location: LocationDTO;
    setLocation: (location: LocationDTO) => void;
    setStep: (step: number) => void;
}
const ConfirmLocation = ({ location, setLocation, setStep }: ConfirmLocationProps) => {
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY as string;
    const [loading, setLoading] = useState(false);

    // Atualizar localização quando o marcador for arrastado
    function handleMarkerDragEnd(event: google.maps.MapMouseEvent) {
        const lat = event.latLng?.lat();
        const lng = event.latLng?.lng();
        if (lat && lng) setLocation({ lat, lng });
    }


    return (
        <motion.main className="mt-12"
            initial={{ opacity: 0, x: 100, filter: 'blur(10px)' }}
            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}>
            <div className='p-4 leading-3'>
                <h2 className="uppercase text-2xl font-bold flex items-center gap-1 "><MdNotListedLocation size={25} /> confirmar endereço</h2>
                <span className='text-xs '>
                    Segure e arraste o marcador no mapa para o local desejado.
                </span>
            </div>

            <section className="bg-white p-4  flex flex-col justify-between">
                <article>
                    <AnimatePresence>
                        {location &&
                            <motion.div
                                className="rounded-lg shadow-lg"
                                initial={{ opacity: 0, y: 100, filter: 'blur(10px)' }}
                                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                                exit={{ opacity: 0, y: 100, filter: 'blur(10px)' }}
                                transition={{ duration: 0.4 }}>
                                <LoadScript
                                    googleMapsApiKey={key}>
                                    <GoogleMap
                                        mapContainerStyle={CONTAINER_STYLE}
                                        center={location}
                                        zoom={15}>
                                        <Marker
                                            title={'Localização atual'}
                                            position={{ lat: location.lat, lng: location.lng }}
                                            draggable={true} // Torna o marcador arrastável
                                            onDragEnd={handleMarkerDragEnd} // Atualiza a localização quando o marcador é arrastado
                                        />
                                    </GoogleMap>
                                </LoadScript>
                            </motion.div>}
                    </AnimatePresence>
                    <div className="text-muted-foreground text-xs my-2">
                        <div className="flex items-center gap-1">
                            <strong>Dica:</strong>
                            <span>Marque no mapa onde você encontrará o entregador.</span>
                        </div>
                    </div>
                    <Button
                        loading={loading}
                        variant={'success'}
                        onClick={() => {
                            setLoading(true);
                            setTimeout(() => {
                                setLoading(false);
                                setStep(3)
                            }, 2000);
                        }}
                        className="w-full flex items-center gap-1 my-2">
                        <FaLocationDot size={18} />
                        Confimar localização
                    </Button>
                </article>
            </section>
        </motion.main >
    )
}

// Completar endeço
type CompleteAddressProps = {
    location: LocationDTO;
}

const CompleteAddressSchema = zod.object({
    apelido: zod.string().min(1, 'Informe um apelido para o endereço.'),
    rua: zod.string().optional(),
    bairro: zod.string().optional(),
    cep: zod.string().optional(),
    numero: zod.string().optional(),
    complemento: zod.string().min(1, 'Informe um complemento para o endereço.'),
    referencia: zod.string().min(1, 'Informe uma referência para o endereço.'),
})

export type CompleteAddressForm = z.infer<typeof CompleteAddressSchema>


const CompleteAddress = ({ location }: CompleteAddressProps) => {
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY as string;
    const router = useRouter();
    const [address, setAddress] = useState('');
    const { handleSubmit, register, reset, formState: { errors } } = useForm<CompleteAddressForm>({
        resolver: zodResolver(CompleteAddressSchema)
    })

    const { mutateAsync: handleCompletAddress, isPending } = useMutation({
        mutationKey: ['completeAddress'],
        mutationFn: async ({ apelido, bairro, cep, complemento, numero, referencia, rua }: CompleteAddressForm) => {
            const { data } = await api.post('/endereco', {
                apelido: apelido,
                bairro: bairro,
                cep: cep,
                complemento: complemento,
                numero: numero,
                referencia: referencia,
                rua: rua,
            })


            return data
        }, onSuccess(data) {
            toast.success('Endereço cadastrado com sucesso!')
            router.push(`/deliveryaddress`);
        }, onError(error: any) {
            console.error('Erro ao completar endereço:', error);
            toast.error(error.response.data.message)
            throw error;
        },
    })

    async function handleReverseGeocode(lat: number, lng: number) {
        try {
            const { data } = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${key}`);
            if (data.status === 'OK') {
                const address = data.results[0]?.formatted_address;
                setAddress(address);
                return address;
            } else {
                console.error('Erro na geocodificação reversa:', data.status);
                return null;
            }
        } catch (error) {
            console.error('Erro ao converter lat/lng em endereço:', error);
            throw error;
        }
    };


    function parseAddress(address: string) {
        const addressParts = address.split(',');
        const numberAndNeighborhood = addressParts[1]?.split('-')
        const cityAndState = addressParts[2]?.split('-')

        const rua = addressParts[0]?.trim();
        const numero = numberAndNeighborhood[0]?.trim();
        const bairro = numberAndNeighborhood[1]?.trim();
        const cidade = cityAndState[0]?.trim()
        const estado = cityAndState[1]?.trim()
        const cep = addressParts[3]?.trim()

        return {
            rua,
            numero,
            bairro,
            cidade,
            estado,
            cep
        }
    }

    useEffect(() => {
        const { lat, lng } = location;
        if (lat && lng) {
            handleReverseGeocode(lat, lng);
        }
    }, []);

    useEffect(() => {
        if (address) {
            const parsed = parseAddress(address);
            reset({
                rua: parsed.rua ?? '',
                numero: parsed.numero ?? '',
                bairro: parsed.bairro ?? '',
                cep: parsed.cep ?? '',

            })
        }
    }, [address]);

    return (
        <motion.main className="mt-12"
            initial={{ opacity: 0, x: 100, filter: 'blur(10px)' }}
            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}>
            <div className='p-4 leading-3'>
                <h2 className="uppercase text-xl font-bold flex items-center gap-1 "><MdEditLocationAlt size={25} />complete o seu endereço</h2>
                <span className='text-[12px] '>
                    Complete o endereço com informações adicionais.
                </span>
            </div>

            <section className="bg-white p-4">
                <form onSubmit={handleSubmit((data) => handleCompletAddress(data))} className="space-y-4">
                    <div>
                        <Label className="uppercase" htmlFor="terms">apelido</Label>
                        <Input
                            className="uppercase"
                            {...register('apelido')}
                            error={errors.apelido?.message}
                        />
                    </div>

                    <div>
                        <Label className="uppercase" htmlFor="terms">endereço</Label>
                        <Input
                            disabled
                            className="capitalize"
                            {...register('rua')}
                            error={errors.rua?.message}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label className="uppercase" htmlFor="terms">bairro</Label>
                            <Input
                                disabled
                                type="text"
                                className="capitalize"
                                {...register('bairro')}
                                error={errors.bairro?.message}
                            />
                        </div>

                        <div>
                            <Label className="uppercase" htmlFor="terms">cep </Label>
                            <Input
                                disabled
                                type="text"
                                {...register('cep')}
                                error={errors.cep?.message}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label className="uppercase" htmlFor="terms">número</Label>
                            <Input
                                disabled
                                type="text"
                                className="capitalize"
                                {...register('numero')}
                                error={errors.numero?.message}
                            />
                        </div>

                        <div>
                            <Label className="uppercase" htmlFor="terms">complemento</Label>
                            <Input
                                type="text"
                                placeholder="Ex: Bloco 1, AP 321"
                                {...register('complemento')}
                                error={errors.complemento?.message}
                            />
                        </div>
                    </div>

                    <div className=' '>
                        <Label className="uppercase" htmlFor="terms">referência</Label>
                        <Textarea
                            rows={5}
                            placeholder="Digite sua mensagem aqui."
                            {...register('referencia')}
                            error={errors.referencia?.message}
                        />
                    </div>

                    <Button
                        type="submit"
                        loading={isPending}
                        className="w-full"
                        variant={'success'}>
                        Continuar
                        <IoIosArrowRoundForward size={18} />
                    </Button>
                </form>
            </section>
        </motion.main >
    )
}


export default AddAdress;