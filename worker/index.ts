import {originAllowed,corsHeaders} from '../lib/origins';
import { drainOutbox } from '../lib/mail';
import handler from "vinext/server/fetch-handler";
import { runWithConnectorBinding } from "../lib/connector-context";
import type { ConnectorBinding } from "../lib/connector-contract.mjs";

const worker = {
  async fetch(request: Request, env: Cloudflare.Env, ctx: ExecutionContext<{ CONNECTORS?: ConnectorBinding }>) {
    const origin=request.headers.get('Origin');
    const isApi=new URL(request.url).pathname.startsWith('/api/');
    if(isApi && request.method==='OPTIONS') return new Response(null,{status:originAllowed(origin,request.url,env)?204:403,headers:corsHeaders(origin,request.url,env)});
    const mailTrigger = request.method === 'POST' && new URL(request.url).pathname === '/api/assessment' ? await request.clone().json().then((body:any) => body?.action === 'submit').catch(() => false) : false;
    let binding = ctx.props?.CONNECTORS;
    // Local preview emulates the same request-scoped capability. This branch and
    // the auxiliary service binding are absent from production builds.
    if (import.meta.env.DEV && !binding && env.CONNECTORS) {
      const preview = env.CONNECTORS;
      const expiresAt = Date.now() + 60_000;
      binding = {
        async getContext() {
          if (Date.now() >= expiresAt) return { status: "request_context_expired" };
          return preview.getContext?.() ?? { status: "binding_unavailable" };
        },
        async invoke(connectorId, actionName, args) {
          if (Date.now() >= expiresAt) {
            return { status: "request_context_expired", message: "This request has expired. Please try again." };
          }
          return preview.invoke(connectorId, actionName, args);
        },
      };
    }
    const response = await runWithConnectorBinding(binding, () => handler.fetch(request, env, ctx));
    if(mailTrigger && response.ok) ctx.waitUntil(drainOutbox(env).catch(() => {}));
    if(isApi && origin && originAllowed(origin,request.url,env)){const headers=new Headers(response.headers);for(const [k,v] of Object.entries(corsHeaders(origin,request.url,env)))headers.set(k,v);return new Response(response.body,{status:response.status,statusText:response.statusText,headers})}
    return response;
  },
  scheduled(_event: ScheduledController, env: Cloudflare.Env, ctx: ExecutionContext) { ctx.waitUntil(drainOutbox(env)); },
};

export default worker;
