import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react()
  ],
  resolve: {
    alias: {
      "@src": path.resolve(__dirname, "./src"),
      "@components": path.resolve(__dirname, "./src/components"),
      "@styles": path.resolve(__dirname, "./src/styles"),
      "@pages": path.resolve(__dirname, "./src/pages"),
      "@utils": path.resolve(__dirname, "./src/utils"),
      "@graphql": path.resolve(__dirname, "./src/graphql"),
      "@interfaces": path.resolve(__dirname, "./src/interfaces"),
      "@assets": path.resolve(__dirname, "./src/assets"),
      "@data": path.resolve(__dirname, "./src/data"),
    }
  }
})
