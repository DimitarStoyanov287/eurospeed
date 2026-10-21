import {mailScript} from '../../../lib/mail-script';
export async function GET(){return new Response(mailScript,{headers:{'Content-Type':'text/plain; charset=utf-8','X-Content-Type-Options':'nosniff','Cache-Control':'public, max-age=300'}})}
