import { defineConfig } from 'vite'
import { headerPlugin } from './vite-plugin-header.js'

export default defineConfig({
    plugins: [headerPlugin()],
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
