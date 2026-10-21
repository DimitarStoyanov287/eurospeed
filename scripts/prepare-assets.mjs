import {mkdirSync,readdirSync,copyFileSync} from 'node:fs';
import path from 'node:path';
const source=path.resolve('node_modules/@electric-sql/pglite/dist'),target=path.resolve('public/pglite');mkdirSync(target,{recursive:true});
for(const file of readdirSync(source))if(/\.(js|wasm|data)$/.test(file))copyFileSync(path.join(source,file),path.join(target,file));
