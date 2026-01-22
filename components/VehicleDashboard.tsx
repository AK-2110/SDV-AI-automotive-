'use client';

import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Battery, Zap, Activity, Thermometer, Navigation, LocateFixed, History, Fuel, Droplets, Disc, CircleDashed } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import dynamic from 'next/dynamic';
import clsx from 'clsx';

// Dynamic import for Leaflet map
const MapWidget = dynamic(() => import('./MapWidget'), {
    ssr: false,
    loading: () => <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-zinc-500">Loading Navigation...</div>
});

interface VehicleData {
    speed: number;
    rpm: number;
    battery: number;
    range: number;
    temp: number;
    gear: string;
    throttle: number;
    brake: number;
    steering: number;
    tpms: {
        fl: number;
        fr: number;
        rl: number;
        rr: number;
    };
    prediction: {
        type: string;
        message: string;
        confidence: number;
    } | null;
    location?: {
        lat: number;
        lng: number;
        route: [number, number][];
    };
    timestamp: number;
}

export default function VehicleDashboard() {
    const [data, setData] = useState<VehicleData | null>(null);
    const [history, setHistory] = useState<any[]>([]);
    const [useRealGps, setUseRealGps] = useState(false);
    const [gpsError, setGpsError] = useState<string | null>(null);

    // Real GPS State
    const watchIdRef = useRef<number | null>(null);
    const lastPosRef = useRef<{ lat: number, lng: number, time: number } | null>(null);

    // Simulation Data Fetcher
    useEffect(() => {
        if (useRealGps) return; // Stop fetching simulation if using real GPS

        const interval = setInterval(async () => {
            try {
                const res = await fetch('/api/vehicle');
                const json = await res.json();
                setData(json);
                setHistory(prev => [...prev.slice(-20), { time: new Date().toLocaleTimeString(), speed: json.speed }]);
            } catch (e) {
                console.error("Failed to fetch vehicle data");
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [useRealGps]);

    // Real GPS Logic
    useEffect(() => {
        if (!useRealGps) {
            if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
                watchIdRef.current = null;
            }
            return;
        }

        if (!navigator.geolocation) {
            setGpsError("Geolocation not supported");
            return;
        }

        watchIdRef.current = navigator.geolocation.watchPosition(
            (position) => {
                const { latitude, longitude, speed } = position.coords;
                const now = Date.now();

                // Calculate speed if null (iOS/Android sometimes return null speed)
                let currentSpeed = speed ? Math.round(speed * 3.6) : 0; // m/s to km/h

                if (speed === null && lastPosRef.current) {
                    const dist = getDistance(lastPosRef.current.lat, lastPosRef.current.lng, latitude, longitude);
                    const timeDiff = (now - lastPosRef.current.time) / 1000;
                    if (timeDiff > 0) {
                        currentSpeed = Math.round((dist / timeDiff) * 3600);
                    }
                }

                lastPosRef.current = { lat: latitude, lng: longitude, time: now };

                // Merge Real GPS with Mock Car Data (Battery/RPM still need to be mocked for now)
                setData(prev => {
                    if (!prev) return null;
                    const newPath = prev.location?.route ? [...prev.location.route, [latitude, longitude] as [number, number]] : [[latitude, longitude] as [number, number]];
                    // Keep path length reasonable
                    if (newPath.length > 500) newPath.shift();

                    return {
                        ...prev,
                        speed: currentSpeed,
                        location: {
                            lat: latitude,
                            lng: longitude,
                            route: newPath
                        },
                        range: prev.range, // Keep mock data
                        battery: prev.battery, // Keep mock data
                        rpm: Math.round(currentSpeed * 30 + 1000), // Approximate RPM from speed
                    };
                });

                setHistory(prev => [...prev.slice(-20), { time: new Date().toLocaleTimeString(), speed: currentSpeed }]);
                setGpsError(null);
            },
            (err) => {
                console.error(err);
                setGpsError(err.message);
            },
            { enableHighAccuracy: true, maximumAge: 0 }
        );

        return () => {
            if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
            }
        };
    }, [useRealGps]);

    // Haversine for manual speed calc
    function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    if (!data && !useRealGps) return <div className="text-white p-10">Loading Vehicle Systems...</div>;

    return (
        <div className="flex flex-col h-full bg-black text-white p-6 gap-6 font-sans">
            {/* Top Bar: Status */}
            <div className="flex justify-between items-center bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 backdrop-blur-md">
                <div className="flex items-center gap-4">
                    <Activity className="text-green-400 animate-pulse" />
                    <span className="text-zinc-400 text-sm tracking-wider">SYSTEM OPTIMAL</span>
                </div>

                {/* Source Toggle */}
                <div className="flex gap-2 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
                    <button
                        onClick={() => setUseRealGps(false)}
                        className={clsx("px-3 py-1 text-xs font-medium rounded transition-all flex items-center gap-2", !useRealGps ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-white")}
                    >
                        <History size={14} /> Simulation
                    </button>
                    <button
                        onClick={() => setUseRealGps(true)}
                        className={clsx("px-3 py-1 text-xs font-medium rounded transition-all flex items-center gap-2", useRealGps ? "bg-blue-600 text-white" : "text-zinc-500 hover:text-white")}
                    >
                        <LocateFixed size={14} /> Real GPS
                    </button>
                </div>

                <div className="flex gap-6 text-sm font-medium">
                    <div className="flex items-center gap-2"><Thermometer size={16} className="text-orange-500" /> {data?.temp ?? '--'}°C</div>
                    <div className="flex items-center gap-2"><Zap size={16} className="text-yellow-400" /> {data?.battery ?? '--'}%</div>
                    <ClientClock />
                </div>
            </div>

            {gpsError && useRealGps && (
                <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-2 rounded text-sm text-center">
                    GPS Signal Lost: {gpsError}
                </div>
            )}

            {/* Dashboard Container - Matching Reference Layout */}
            <div className="flex flex-col flex-1 gap-6 min-h-0">

                {/* 1. Top Status Bar (Reference Image 1) */}
                <div className="flex justify-between items-center bg-zinc-900/80 p-6 rounded-2xl border border-zinc-800">
                    <StatusWidget icon={Fuel} label="RANGE" value={data?.range ?? 0} max={450} unit="KM" color="text-blue-500" />
                    <StatusWidget icon={Battery} label="CHARGE" value={data?.battery ?? 0} max={100} unit="%" color="text-green-500" />
                    <StatusWidget icon={Thermometer} label="TEMP" value={data?.temp ?? 20} max={100} unit="°C" color="text-orange-500" />
                    <StatusWidget icon={Droplets} label="OIL" value={98} max={100} unit="%" color="text-yellow-500" />
                    <StatusWidget icon={Disc} label="BRAKE" value={92} max={100} unit="%" color="text-zinc-400" />
                    <StatusWidget
                        icon={CircleDashed}
                        label="TIRES (MIN)"
                        value={data?.tpms ? Math.min(data.tpms.fl, data.tpms.fr, data.tpms.rl, data.tpms.rr).toFixed(1) : 0}
                        max={40}
                        unit="PSI"
                        color={data?.tpms && Math.min(data.tpms.fl, data.tpms.fr, data.tpms.rl, data.tpms.rr) < 30 ? "text-red-500 animate-pulse" : "text-cyan-400"}
                    />
                </div>

                {/* 2. Main Split: Cluster/Map vs Analysis */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">

                    {/* Left: Digital Cluster (Reference Image 2 - Blue Style) */}
                    <div className="col-span-12 lg:col-span-7 grid grid-cols-1 gap-6">
                        {/* Simulation/Map View */}
                        <div className="flex-1 rounded-3xl border border-white/10 bg-zinc-900/40 backdrop-blur-xl relative overflow-hidden flex flex-col shadow-2xl shadow-blue-900/20">
                            {data?.location ? (
                                <div className="flex-1 relative">
                                    <MapWidget
                                        position={[data.location.lat, data.location.lng]}
                                        path={data.location.route}
                                    />
                                    {/* Overlay HUD */}
                                    <div className="absolute inset-0 pointer-events-none p-6 flex flex-col justify-between z-10">
                                        <div className="flex justify-between items-start">
                                            <div className="bg-black/60 backdrop-blur-md p-3 rounded-2xl border border-white/10 shadow-lg">
                                                <div className="text-[10px] text-zinc-400 font-bold tracking-[0.2em] mb-1">REAL-TIME GPS</div>
                                                <div className="text-white font-mono text-sm flex items-center gap-2">
                                                    <span className={clsx("w-2 h-2 rounded-full", useRealGps ? "bg-green-500 animate-pulse" : "bg-blue-500")}></span>
                                                    {useRealGps ? 'ACTIVE' : 'SIMULATION'}
                                                </div>
                                            </div>
                                            <div className="bg-black/60 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-right shadow-lg min-w-[120px]">
                                                <div className="text-5xl font-black text-white italic tracking-tighter">{data?.speed ?? 0}</div>
                                                <div className="text-xs text-blue-400 font-bold tracking-widest mt-1">KM/H</div>
                                                <div className="text-xs text-zinc-500 font-mono mt-1 border-t border-white/10 pt-1">
                                                    {data?.rpm ?? 0} <span className="text-[10px]">RPM</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Bottom Telemetry Overlay */}
                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="col-span-1 bg-black/60 backdrop-blur-md p-3 rounded-2xl border border-white/10">
                                                <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2">Pedal Input</div>
                                                <div className="space-y-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className="text-[10px] font-bold text-white w-6">THR</div>
                                                        <div className="h-1.5 flex-1 bg-zinc-800 rounded-full overflow-hidden">
                                                            <motion.div
                                                                className="h-full bg-gradient-to-r from-blue-600 to-cyan-400"
                                                                animate={{ width: `${data?.throttle}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="text-[10px] font-bold text-white w-6">BRK</div>
                                                        <div className="h-1.5 flex-1 bg-zinc-800 rounded-full overflow-hidden">
                                                            <motion.div
                                                                className="h-full bg-gradient-to-r from-red-600 to-orange-500"
                                                                animate={{ width: `${data?.brake}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-span-2 bg-black/60 backdrop-blur-md p-3 rounded-2xl border border-white/10 flex items-center justify-around">
                                                {['P', 'R', 'N', 'D'].map(g => (
                                                    <div key={g} className={clsx("flex flex-col items-center transition-all duration-300", data?.gear === g ? "scale-110" : "opacity-30 scale-90")}>
                                                        <span className={clsx("text-2xl font-black", data?.gear === g ? "text-transparent bg-clip-text bg-gradient-to-b from-white to-blue-400 filter drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]" : "text-zinc-500")}>
                                                            {g}
                                                        </span>
                                                        {data?.gear === g && <motion.div layoutId="gear-active" className="w-1 h-1 bg-blue-500 rounded-full mt-1" />}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    {/* Vignette Overlay */}
                                    <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/80 via-transparent to-black/20" />
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-zinc-600 gap-4">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full animate-pulse" />
                                        <Navigation size={48} className="relative z-10 text-zinc-500" />
                                    </div>
                                    <p className="text-sm font-medium tracking-widest text-zinc-700">INITIALIZING SYSTEMS...</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: Driving Analysis (Reference Image 1 - Chart & Stars) */}
                    <div className="col-span-12 lg:col-span-5 bg-zinc-900/80 p-6 rounded-2xl border border-zinc-800 flex flex-col">
                        <h2 className="text-zinc-400 text-xs font-bold tracking-[0.2em] uppercase mb-1">Driving Analysis</h2>

                        {/* 1. Chart Section */}
                        <div className="h-48 relative mb-6">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={history}>
                                    <defs>
                                        <linearGradient id="colorSpeed" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="time" hide />
                                    <YAxis hide />
                                    <Tooltip contentStyle={{ background: '#000', border: '1px solid #333' }} />
                                    <Area type="monotone" dataKey="speed" stroke="#ef4444" fillOpacity={1} fill="url(#colorSpeed)" strokeWidth={2} />
                                </AreaChart>
                            </ResponsiveContainer>
                            <div className="absolute top-2 right-2 text-xs text-red-400 font-bold border border-red-900/50 bg-red-900/10 px-2 py-1 rounded">
                                AVERAGE: 45 KM/H
                            </div>
                        </div>

                        {/* 2. Star Ratings (Reference Image 1) */}
                        <div className="flex flex-col gap-5 flex-1 justify-center">
                            <StarRating label="Acceleration" rating={5} color="text-green-500" />
                            <StarRating label="Gear Efficiency" rating={4} color="text-green-500" />
                            <StarRating label="Braking" rating={5} color="text-green-500" />
                        </div>

                        {/* 3. Predictive Alert (Moved here) */}
                        <div className="mt-6 p-4 bg-zinc-950 rounded-xl border border-zinc-800">
                            <div className="flex items-center gap-2 mb-2">
                                <Activity size={14} className="text-blue-500" />
                                <span className="text-zinc-300 text-xs font-bold">AI PREDICTION</span>
                            </div>
                            <div className="text-sm text-zinc-400">
                                {data?.prediction ? data.prediction.message : "Vehicle systems nominal. No maintenance required."}
                            </div>
                        </div>

                    </div>
                </div>
            </div>

        </div>
    );
}

// --- Sub Components ---

function StatusWidget({ icon: Icon, label, value, max, unit, color }: any) {
    const dots = 10;
    const filledDots = Math.round((value / max) * dots);

    return (
        <div className="flex flex-col items-center gap-2">
            <Icon size={20} className={clsx(color, "mb-1")} />

            {/* Dotted Bar */}
            <div className="flex gap-1">
                {Array.from({ length: dots }).map((_, i) => (
                    <div
                        key={i}
                        className={clsx(
                            "w-1.5 h-1.5 rounded-full transition-all",
                            i < filledDots ? color.replace('text-', 'bg-') : "bg-zinc-800"
                        )}
                    />
                ))}
            </div>

            <div className="text-[10px] font-bold text-zinc-500 tracking-widest mt-1">{label}</div>

            {/* Added Numeric Value Display */}
            <div className="text-xs font-mono font-medium text-white">
                {value} <span className="text-[10px] text-zinc-600">{unit}</span>
            </div>
        </div>
    );
}

function StarRating({ label, rating, color }: any) {
    return (
        <div className="flex justify-between items-center bg-zinc-950/50 p-3 rounded-lg border border-zinc-800/50">
            <span className="text-sm font-bold text-zinc-300">{label}</span>
            <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className={clsx("w-4 h-4 text-xs flex items-center justify-center", i < rating ? color : "text-zinc-800")}>
                        ★
                    </div>
                ))}
            </div>
        </div>
    );
}

function ClientClock() {
    const [time, setTime] = useState<string>("");

    useEffect(() => {
        setTime(new Date().toLocaleTimeString());
        const timer = setInterval(() => setTime(new Date().toLocaleTimeString()), 1000);
        return () => clearInterval(timer);
    }, []);

    return <div className="flex items-center gap-2 text-zinc-400 font-mono text-sm">{time || "--:--:--"}</div>;
}
