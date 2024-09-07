
'use client'
import { LocationDTO } from "@/dto/addressDTO";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

import { Button } from "@/components/ui/button";

import { FaLocationDot } from "react-icons/fa6";
import { MdNotListedLocation } from "react-icons/md";

import { GoogleMap, Marker } from '@react-google-maps/api';
import GoogleMapsLoader from "../GoogleMapsLoader";

const CONTAINER_STYLE = {
    width: '100%',
    height: '300px'
};

type Props = {
    location: LocationDTO;
    setLocation: (location: LocationDTO) => void;
    setStep: (step: number) => void;
}
const ConfirmLocation = ({ location, setLocation, setStep }: Props) => {
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
                                <GoogleMapsLoader>
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
                                </GoogleMapsLoader>
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

export default ConfirmLocation;