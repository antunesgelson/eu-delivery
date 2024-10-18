import { Libraries, LoadScriptNext } from '@react-google-maps/api';
import React from 'react';

type Props = {
    children: React.ReactElement;
};
const LIBRARIES: Libraries = ['places'];

const GoogleMapsLoader = ({ children }: Props) => {
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY as string;
    return (
        <LoadScriptNext
            googleMapsApiKey={key}
            libraries={LIBRARIES}>
            {children}
        </LoadScriptNext>
    );
};

export default GoogleMapsLoader;