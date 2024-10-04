import { LoadScript } from '@react-google-maps/api';
import React from 'react';

type Props = {
    children: React.ReactNode;
};

const GoogleMapsLoader = ({ children }: Props) => {
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY as string;
    return (
        <LoadScript
            googleMapsApiKey={key}
            libraries={['places']}>
            {children}
        </LoadScript>
    );
};

export default GoogleMapsLoader;