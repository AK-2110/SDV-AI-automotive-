
import VehicleDashboard from '@/components/VehicleDashboard';

export const metadata = {
    title: 'SDV - Vehicle Health Dashboard',
};

export default function DashboardPage() {
    return (
        <main className="h-screen w-full bg-black">
            <VehicleDashboard />
        </main>
    );
}
