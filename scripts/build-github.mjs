import './prepare-assets.mjs';
import {spawnSync} from 'node:child_process';
process.env.VITE_API_ORIGIN ||= 'https://eurospeed-junior-test.eurospeed-4437.chatgpt.site';
const r=spawnSync(process.execPath,['node_modules/vite/bin/vite.js','build','--config','vite.github.config.ts'],{stdio:'inherit',env:process.env});if(r.error)throw r.error;process.exitCode=r.status??1;
