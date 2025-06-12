import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
// Define __dirname using import.meta.url
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// https://vite.dev/config/
export default defineConfig({
    // server: {
    //   host: true, // this allows it to be accessible via your local IP
    //   port: 5173, // optional, default is 5173
    // },
    plugins: [react()],
    resolve: {
        alias: {
            "@src": path.resolve(__dirname, "./src"),
            "@components": path.resolve(__dirname, "./src/components"),
            "@contexts": path.resolve(__dirname, "./src/contexts"),
            "@styles": path.resolve(__dirname, "./src/styles"),
            "@pages": path.resolve(__dirname, "./src/pages"),
            "@utils": path.resolve(__dirname, "./src/utils"),
            "@graphql": path.resolve(__dirname, "./src/graphql"),
            "@interfaces": path.resolve(__dirname, "./src/interfaces"),
            "@assets": path.resolve(__dirname, "./src/assets"),
            "@data": path.resolve(__dirname, "./src/data"),
        }
    }
});
