'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon in Next.js
const icon = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

interface MapProps {
    position: [number, number];
    path?: [number, number][];
}

function MapUpdater({ position }: { position: [number, number] }) {
    const map = useMap();
    useEffect(() => {
        map.flyTo(position, 16, { duration: 1 });
    }, [position, map]);
    return null;
}

export default function MapWidget({ position, path = [] }: MapProps) {
    if (!position) return null;

    return (
        <MapContainer
            key="vehicle-map"
            center={position}
            zoom={15}
            style={{ height: "100%", width: "100%", background: "#09090b" }}
            zoomControl={false}
            attributionControl={false}
        >
            <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
            <Marker position={position} icon={icon} />
            {path.length > 0 && <Polyline positions={path} color="#3b82f6" weight={4} opacity={0.7} />}
            <MapUpdater position={position} />
        </MapContainer>
    );
}
