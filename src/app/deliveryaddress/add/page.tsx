'use client'
import { LocationDTO } from "@/dto/addressDTO";
import { useState } from "react";

import React from "react";
import CompleteAddress from "./components/CompleteAddress";
import ConfirmLocation from "./components/ConfirmLocation";
import SearchLocation from "./components/SearchLocation";

export default function AddAdress() {
    const [step, setStep] = React.useState(1);
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
    )}