import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({base:'/eurospeed/',plugins:[react()],build:{outDir:'github-dist',emptyOutDir:true,rolldownOptions:{input:{index:'index.html',admin:'admin.html'}}}});
