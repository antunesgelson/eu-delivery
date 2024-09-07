'use client'
import { LocationDTO } from "@/dto/addressDTO";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { IoMdLocate } from "react-icons/io";
import { MdAddLocationAlt } from "react-icons/md";

import { Autocomplete } from '@react-google-maps/api';
import GoogleMapsLoader from "../GoogleMapsLoader";

type Props = {
    setLocation: (location: LocationDTO) => void;
    setStep: (step: number) => void;
}

const SearchLocation = ({ setLocation, setStep }: Props) => {
    const [loading, setLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement | null>(null);
    const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

    function handlePlaceChanged() {
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

    function handleGetCurrentLocation() {
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
                    <GoogleMapsLoader>
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
                    </GoogleMapsLoader>
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

export default SearchLocation;
