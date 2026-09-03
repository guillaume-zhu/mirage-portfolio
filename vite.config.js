import { defineConfig } from 'vite'

export default defineConfig({
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
