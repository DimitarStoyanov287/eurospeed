// Public build settings contain only an API origin and a URL base, never credentials.
const settings=(import.meta as any).env||{};
const remoteApi=String(settings.VITE_API_ORIGIN||'').replace(/\/$/,'');
const base=String(settings.BASE_URL||'/');
export const apiPath=(path:string)=>remoteApi+path;
export const pagePath=(page:'home'|'admin')=>remoteApi?base+(page==='admin'?'admin.html':'index.html'):(page==='admin'?'/admin':'/');
export const assetPath=(file:string)=>(remoteApi?base:'/')+file;
