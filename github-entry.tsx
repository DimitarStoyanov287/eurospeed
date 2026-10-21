import {createRoot} from 'react-dom/client';
import Assessment from './app/ui';
import Admin from './app/admin/ui';
import './app/globals.css';
createRoot(document.getElementById('root')!).render(document.body.dataset.view==='admin'?<Admin/>:<Assessment/>);
