import {lookup as dnsLookup} from 'node:dns/promises';
const fields=['phonetic','roots','extension','example','exampleZh'];
const officialHost='api.deepseek.com';
const error=(message,status=400)=>Object.assign(new Error(message),{status});

export function isPrivateAddress(address){
  const ip=String(address).toLowerCase();
  if(ip.includes(':')){
    if(ip==='::1'||ip==='::'||ip.startsWith('fc')||ip.startsWith('fd')||/^fe[89ab]/.test(ip))return true;
    const mapped=ip.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    return mapped?isPrivateAddress(mapped[1]):false;
  }
  const parts=ip.split('.').map(Number);
  if(parts.length!==4||parts.some(n=>!Number.isInteger(n)||n<0||n>255))return true;
  const [a,b]=parts;
  return a===0||a===10||a===127||a>=224||a===169&&b===254||a===172&&b>=16&&b<=31||a===192&&b===168||a===100&&b>=64&&b<=127||a===192&&b===0||a===198&&b>=18&&b<=19;
}

export function validatePairs(items){
  if(!Array.isArray(items)||items.length<1||items.length>20)throw error('每次仅支持 1–20 条词汇');
  return items.map(w=>{
    if(!w||typeof w.text!=='string'||typeof w.translation!=='string'||w.text.length>120||w.translation.length>120||!/[A-Za-z]/.test(w.text))throw error('词条格式不正确');
    return{text:w.text.trim(),translation:w.translation.trim()};
  });
}

export function resolveApiConfig(input={},allowedHosts=process.env.ENRICH_ALLOWED_HOSTS||''){
  if(!input||typeof input!=='object'||Array.isArray(input))throw error('接口设置格式不正确');
  const base=String(input.baseUrl||'https://api.deepseek.com').trim().replace(/\/+$/,'');
  if(base.length>500)throw error('API 地址过长');
  let url;try{url=new URL(base);}catch{throw error('API 地址无效');}
  if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash||url.port)throw error('API 地址必须是公开 HTTPS 地址，且不能含账号、端口或参数');
  const host=url.hostname.toLowerCase();
  if(!/^[a-z0-9.-]+$/.test(host)||host==='localhost'||['.localhost','.local','.internal','.test','.example','.lan','.home'].some(suffix=>host.endsWith(suffix))||/^\d+\.\d+\.\d+\.\d+$/.test(host)||host.includes('..')||!host.includes('.'))throw error('不允许使用本机、内网或 IP 地址');
  const official=host===officialHost;
  const allow=new Set(String(allowedHosts).split(',').map(x=>x.trim().toLowerCase()).filter(Boolean));
  if(!official&&!allow.has(host))throw error('中转域名未获服务端允许；请先配置 ENRICH_ALLOWED_HOSTS',403);
  const path=url.pathname.replace(/\/+$/,'');
  if(path&&path!=='/'&&!/^(?:\/[a-zA-Z0-9._~-]+)*$/.test(path))throw error('API 路径包含不支持的字符');
  url.pathname=path.endsWith('/chat/completions')?path:`${path==='/'?'':path}/chat/completions`;
  const model=String(input.model||'deepseek-flash').trim();
  if(!model||model.length>120||!/^[a-zA-Z0-9._/-]+$/.test(model))throw error('模型 ID 无效');
  const authMode=input.authMode||'auto';
  if(!['auto','bearer','x-api-key'].includes(authMode))throw error('认证方式无效');
  return{url:url.toString(),model,authMode,official};
}

const systemPrompt=`你是英语词汇编辑。只返回 JSON 对象，格式 {"items":[{"text":"Delegate","phonetic":"[ˈdelɪɡət]","roots":"deleg：委派","extension":"A person authorized to represent others.","example":"The delegate arrived at the meeting.","exampleZh":"代表抵达会议现场。"}]}。词条顺序与输入完全一致，不得修改英文 text，不要生成 translation。只补充自然、准确的英语读音、词根拆解、简明英文释义和中英对应例句；尽量使用日内瓦、外交、建筑、园林或日常语境。无法确定时填空字符串，不编造事实。只输出 JSON。`;

export async function enrichPairs(items,{key=process.env.VOCAB_API_KEY||process.env.DEEPSEEK_API_KEY,fetcher=fetch,config={},allowedHosts,lookup=dnsLookup}={}){
  const pairs=validatePairs(items);
  const resolved=resolveApiConfig(config,allowedHosts);
  if(!key)throw error('尚未配置 API Key；可继续直接导入词汇。',503);
  if(!resolved.official){
    let records;try{records=await lookup(new URL(resolved.url).hostname,{all:true});}catch{throw error('中转域名 DNS 解析失败',502);}
    if(!records.length||records.some(record=>isPrivateAddress(record.address)))throw error('中转域名解析到本机或内网地址',403);
  }
  const headers={'Content-Type':'application/json'};
  if(resolved.authMode==='x-api-key')headers['x-api-key']=key;else headers.Authorization=`Bearer ${key}`;
  const request={model:resolved.model,stream:false,response_format:{type:'json_object'},max_tokens:8192,messages:[{role:'system',content:systemPrompt},{role:'user',content:JSON.stringify(pairs)}]};
  if(resolved.official)request.thinking={type:'disabled'};
  let response;
  try{response=await fetcher(resolved.url,{method:'POST',headers,body:JSON.stringify(request),redirect:'error',signal:AbortSignal.timeout(55000)});}
  catch(e){throw error(e.name==='TimeoutError'?'模型请求超时':'无法连接模型接口，请检查地址和网络',502);}
  if(!response.ok)throw error(`模型请求失败（HTTP ${response.status}）`,502);
  let body;try{body=await response.json();}catch{throw error('模型返回格式无效',502);}
  const choice=body?.choices?.[0];
  if(choice?.finish_reason==='length')throw error('模型输出被截断，请缩小批次重试',502);
  if(choice?.finish_reason==='content_filter')throw error('模型未通过内容审核；可直接导入基础词条',502);
  if(choice?.finish_reason==='insufficient_system_resource'||choice?.finish_reason==='aborted')throw error('模型服务中断，请稍后重试',502);
  if(choice?.finish_reason!=='stop')throw error('模型未完整结束，请重试',502);
  const content=choice.message?.content;
  if(typeof content!=='string'||!content.trim())throw error('模型返回空内容，请重试',502);
  let parsed;try{parsed=JSON.parse(content);}catch{throw error('模型 JSON 解析失败',502);}
  if(!Array.isArray(parsed.items)||parsed.items.length!==pairs.length)throw error('模型返回条数不匹配',502);
  return pairs.map((pair,i)=>{
    const generated=parsed.items[i];
    if(!generated||typeof generated.text!=='string'||generated.text.trim().toLowerCase()!==pair.text.toLowerCase())throw error('模型返回词条顺序不匹配',502);
    const result={...pair};
    for(const name of fields)result[name]=typeof generated[name]==='string'?generated[name].trim().slice(0,800):'';
    return result;
  });
}

export async function apiResponse(req,res,{local=false}={}){
  res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');
  if(req.method!=='POST'){res.statusCode=405;res.end(JSON.stringify({error:'仅支持 POST'}));return;}
  try{
    if(!local&&(!process.env.ENRICH_ACCESS_TOKEN||req.headers['x-enrich-token']!==process.env.ENRICH_ACCESS_TOKEN))throw error('需要词库补全访问口令',401);
    let raw='';if(req.body!==undefined)raw=typeof req.body==='string'?req.body:JSON.stringify(req.body);else for await(const chunk of req){raw+=chunk;if(raw.length>30000)throw error('请求过大',413);}
    if(raw.length>30000)throw error('请求过大',413);
    const payload=JSON.parse(raw);
    const items=await enrichPairs(payload.items,{config:payload.config});
    res.statusCode=200;res.end(JSON.stringify({items}));
  }catch(e){res.statusCode=e.status||400;res.end(JSON.stringify({error:e.message||'解析失败'}));}
}
