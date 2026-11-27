import {enrichPairs} from '../enrich.mjs';

const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});

export async function handleEnrich(request,env,{enrich=enrichPairs}={}){
  if(request.method!=='POST')return json({error:'仅支持 POST'},405);
  if(!env.ENRICH_ACCESS_TOKEN||request.headers.get('x-enrich-token')!==env.ENRICH_ACCESS_TOKEN)return json({error:'需要词库补全访问口令'},401);
  try{
    const raw=await request.text();
    if(raw.length>30000)return json({error:'请求过大'},413);
    const payload=JSON.parse(raw);
    const items=await enrich(payload.items,{config:payload.config,key:env.VOCAB_API_KEY||env.DEEPSEEK_API_KEY,allowedHosts:env.ENRICH_ALLOWED_HOSTS||''});
    return json({items});
  }catch(e){return json({error:e.message||'解析失败'},e.status||400);}
}

export default {
  async fetch(request,env){
    const path=new URL(request.url).pathname;
    if(path==='/api/enrich')return handleEnrich(request,env);
    if(path.startsWith('/api/'))return json({error:'接口不存在'},404);
    return env.ASSETS.fetch(request);
  }
};
