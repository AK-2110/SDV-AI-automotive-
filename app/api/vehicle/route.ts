
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Simulated Route (Loop in San Francisco)
const ROUTE = [
    [37.7749, -122.4194], // Start
    [37.7751, -122.4200],
    [37.7755, -122.4210],
    [37.7760, -122.4220],
    [37.7765, -122.4230],
    [37.7770, -122.4240],
    [37.7780, -122.4250],
    [37.7790, -122.4260], // Mid
    [37.7780, -122.4270],
    [37.7770, -122.4260],
    [37.7760, -122.4250],
    [37.7749, -122.4194]  // Loop back
];

// Server-side state simulation (in memory for demo purposes)
let currentIndex = 0;
let lastUpdate = Date.now();

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function getVehicleData() {
    const now = Date.now();
    const timeDelta = (now - lastUpdate) / 1000; // seconds

    // Move vehicle
    if (timeDelta > 1) {
        currentIndex = (currentIndex + 1) % ROUTE.length;
        lastUpdate = now;
    }

    const currentPos = ROUTE[currentIndex];
    const nextPos = ROUTE[(currentIndex + 1) % ROUTE.length];

    // Simulate some physics-based fluctuations
    const time = Date.now() / 1000;

    // Dynamic Speed (if not GPS mode, rely on this simulated sine wave)
    const simulatedSpeed = Math.abs(Math.sin(time / 5)) * 120; // 0-120 km/h cycle
    // Original logic used `coords.speed`, which is not available. Reverting to simulated speed.
    const speed = simulatedSpeed; // m/s to km/h if GPS

    const rpm = speed * 40 + 800 + Math.random() * 100; // Rough correlation to speed
    const battery = Math.max(0, 100 - (Date.now() % 10000000) / 100000); // Slow drain
    const range = (battery / 100) * 450; // Max 450km range
    const temp = 20 + speed / 10;

    // New Advanced Data
    const gear = speed === 0 ? 'P' : (speed < 0 ? 'R' : 'D');
    const throttle = speed > 0 ? (speed / 120) * 100 : 0; // Rough throttle mapping
    const brake = speed < 10 && speed > 0 ? 50 : 0; // Brake when slowing down (simplified)
    const steering = Math.sin(time / 2) * 30; // -30 to +30 degrees steering

    // Tire Pressure Monitoring (PSI) - slightly fluctuating around 35
    const tpms = {
        fl: 35 + Math.sin(time) * 0.5,
        fr: 35 + Math.cos(time) * 0.5,
        rl: 34 + Math.sin(time + 1) * 0.5,
        rr: 34 + Math.cos(time + 1) * 0.5,
    };

    // Predictive Diagnostics (simulated occasionally)
    const prediction = Math.random() > 0.8 ? {
        type: 'Maintenance',
        message: 'Rear Left Tire pressure trending low. Check for slow leak.',
        confidence: 0.88
    } : null;

    // Original logic used `coords.latitude`, `coords.longitude`, `coords.heading`.
    // Reverting to the original `ROUTE` based location for consistency with the file.
    const location = {
        lat: currentPos[0],
        lng: currentPos[1],
        heading: (currentIndex / ROUTE.length) * 360 // Simple simulated heading
    };

    return {
        speed: Math.round(speed),
        rpm: Math.round(rpm),
        battery: Math.round(battery),
        range: Math.round(range),
        temp: Math.round(temp),
        gear,
        throttle: Math.round(throttle),
        brake: Math.round(brake),
        steering: Math.round(steering),
        tpms,
        prediction,
        location: location,
        timestamp: new Date().toISOString()
    };
}

export async function GET() {
    const data = getVehicleData();
    return NextResponse.json(data);
}
