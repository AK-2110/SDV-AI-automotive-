
import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'SDV GenAI Workbench',
        short_name: 'SDV Workbench',
        description: 'Software Defined Vehicle Generative AI Platform',
        start_url: '/dashboard',
        display: 'standalone',
        background_color: '#000000',
        theme_color: '#000000',
        icons: [
            {
                src: '/icon',
                sizes: 'any',
                type: 'image/png',
            },
        ],
    }
}
