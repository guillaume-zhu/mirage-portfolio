import { defineConfig } from 'vite'
import { partialsPlugin } from './vite-plugin-partials.js'

export default defineConfig({
    plugins: [partialsPlugin()],
    build: {
        rollupOptions: {
            input: {
                main: 'index.html',
                about: 'about.html',
                floraObscura: 'flora-obscura.html',
                heliosBloom: 'helios-bloom.html',
                petalRadiance: 'petal-radiance.html',
                inTransit: 'in-transit.html',
            },
        },
    },
})
