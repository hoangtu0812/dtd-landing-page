import {createServer} from 'node:http';
import {readFile,writeFile,rename} from 'node:fs/promises';
import {createHash,randomUUID,randomBytes} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {validateConfig} from './dist/data-model.mjs';
import {readPasswordRecord,verifyPassword,loginPage} from './admin/auth.mjs';
const defaultRoot=fileURLToPath(new URL('./dist/',import.meta.url));
const defaultAdminRoot=fileURLToPath(new URL('./admin/',import.meta.url));
const defaultAuthPath=fileURLToPath(new URL('./.local/admin-auth.json',import.meta.url));
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg'};
const revisionOf=content=>createHash('sha256').update(content).digest('hex');
export function createPreviewServer({root=defaultRoot,adminRoot=defaultAdminRoot,authPath=defaultAuthPath,sessionTtlMs=8*60*60*1000}={}){
  const configPath=path.join(root,'site-config.json');let writing=false;
  const sessions=new Map();let failures=0,blockedUntil=0,loginBusy=false;
  const sessionCookie=(value,seconds)=>'bsr_admin='+value+'; HttpOnly; SameSite=Strict; Path=/; Max-Age='+seconds;
  return createServer(async(req,res)=>{
    res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
    res.setHeader('X-Frame-Options','DENY');res.setHeader('Referrer-Policy','same-origin');
    function json(status,body){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(body));}
    function html(status,body){res.writeHead(status,{'Content-Type':'text/html; charset=utf-8'});res.end(req.method==='HEAD'?undefined:body);}
    function redirect(url){res.writeHead(303,{Location:url});res.end();}
    async function body(limit){let size=0;const chunks=[];for await(const chunk of req){size+=chunk.length;if(size>limit){const error=new Error('Dữ liệu vượt quá giới hạn cho phép.');error.status=413;throw error;}chunks.push(chunk);}return Buffer.concat(chunks).toString('utf8');}
    try{
      const host=req.headers.host||'';
      if(!/^(127\.0\.0\.1|localhost|\[::1\]):\d+$/.test(host)){json(403,{error:'Máy chủ chỉ chấp nhận truy cập local.'});return;}
      const origin='http://'+host;
      const requestPath=decodeURIComponent(new URL(req.url,origin).pathname);
      const normalizedPath=requestPath.replaceAll('\\','/');
      const authRoute=normalizedPath==='/admin'||normalizedPath==='/admin.html'||normalizedPath.startsWith('/admin/')||['/api/login','/api/logout','/api/admin-session'].includes(normalizedPath)||(normalizedPath==='/api/config'&&req.method!=='GET');
      let record=null,sessionId='',authenticated=false;
      if(authRoute){
        record=await readPasswordRecord(authPath);
        sessionId=(req.headers.cookie||'').split(';').map(c=>c.trim()).find(c=>c.startsWith('bsr_admin='))?.slice(10)||'';
        for(const [id,session] of sessions)if(session.expires<=Date.now()||session.fingerprint!==record?.fingerprint)sessions.delete(id);
        authenticated=!!record&&sessions.has(sessionId);
      }
      const sameOrigin=()=>req.headers.origin===origin&&req.headers['sec-fetch-site']!=='cross-site';
      if(normalizedPath==='/api/login'){
        if(req.method!=='POST'){json(405,{error:'Phương thức không được hỗ trợ.'});return;}
        if(!sameOrigin()){json(403,{error:'Nguồn đăng nhập không hợp lệ.'});return;}
        if(!record){html(503,loginPage({configured:false}));return;}
        if(blockedUntil>Date.now()||loginBusy){res.setHeader('Retry-After','600');html(429,loginPage({configured:true,error:'Đã có nhiều yêu cầu đăng nhập. Vui lòng thử lại sau 10 phút.'}));return;}
        if(!(req.headers['content-type']||'').startsWith('application/x-www-form-urlencoded')){json(415,{error:'Định dạng đăng nhập không hợp lệ.'});return;}
        const password=new URLSearchParams(await body(4096)).get('password');
        loginBusy=true;let verified;try{verified=await verifyPassword(password,record);}finally{loginBusy=false;}
        if(!verified){failures++;if(failures>=5){blockedUntil=Date.now()+600000;failures=0;}html(401,loginPage({configured:true,error:'Mật khẩu không đúng.'}));return;}
        failures=0;blockedUntil=0;
        if(sessionId)sessions.delete(sessionId);
        if(sessions.size>=100)sessions.delete(sessions.keys().next().value);
        const id=randomBytes(32).toString('hex');
        sessions.set(id,{expires:Date.now()+sessionTtlMs,fingerprint:record.fingerprint});
        res.setHeader('Set-Cookie',sessionCookie(id,Math.floor(sessionTtlMs/1000)));redirect('/admin');return;
      }
      if(normalizedPath==='/api/logout'){
        if(req.method!=='POST'){json(405,{error:'Phương thức không được hỗ trợ.'});return;}
        if(!sameOrigin()){json(403,{error:'Nguồn đăng xuất không hợp lệ.'});return;}
        sessions.delete(sessionId);res.setHeader('Set-Cookie',sessionCookie('',0));json(200,{ok:true});return;
      }
      if(normalizedPath==='/api/admin-session'){
        if(req.method!=='GET'){json(405,{error:'Phương thức không được hỗ trợ.'});return;}
        json(authenticated?200:401,authenticated?{authenticated:true}:{error:'Vui lòng đăng nhập tại /admin.'});return;
      }
      if(['/admin','/admin/','/admin.html'].includes(normalizedPath)){
        if(!['GET','HEAD'].includes(req.method)){json(405,{error:'Phương thức không được hỗ trợ.'});return;}
        res.setHeader('X-Robots-Tag','noindex, nofollow');
        if(!authenticated){html(200,loginPage({configured:!!record}));return;}
        html(200,await readFile(path.join(adminRoot,'admin.html'),'utf8'));return;
      }
      if(normalizedPath.startsWith('/admin/')){
        if(!authenticated){json(401,{error:'Cần đăng nhập quản trị.'});return;}
        const assets={'/admin/assets/admin.js':'admin.js','/admin/assets/admin.css':'admin.css'};
        if(!['GET','HEAD'].includes(req.method)||!assets[normalizedPath]){json(404,{error:'Không tìm thấy tệp.'});return;}
        const file=path.join(adminRoot,assets[normalizedPath]);const data=await readFile(file);
        res.writeHead(200,{'Content-Type':types[path.extname(file)]});res.end(req.method==='HEAD'?undefined:data);return;
      }
      if(normalizedPath==='/api/config'){
        if(req.method==='GET'){const content=await readFile(configPath,'utf8');json(200,{config:validateConfig(JSON.parse(content)),revision:revisionOf(content)});return;}
        if(req.method!=='PUT'){json(405,{error:'Phương thức không được hỗ trợ.'});return;}
        if(!authenticated){json(401,{error:'Cần đăng nhập quản trị tại /admin trước khi lưu. Nếu phiên hết hạn, hãy xuất cấu hình để giữ lại thay đổi rồi đăng nhập lại.'});return;}
        if(!sameOrigin()){json(403,{error:'Chỉ có thể lưu từ trang quản trị trên máy này.'});return;}
        if(!(req.headers['content-type']||'').startsWith('application/json')){json(415,{error:'Dữ liệu phải ở định dạng JSON.'});return;}
        let config;try{config=validateConfig(JSON.parse(await body(8*1024*1024)));}catch(error){json(error.status||400,{error:error.message});return;}
        if(writing){json(409,{error:'Đang có thao tác lưu khác. Hãy thử lại.'});return;}
        writing=true;
        try{
          const previous=await readFile(configPath,'utf8');if(req.headers['if-match']!==revisionOf(previous)){json(409,{error:'Cấu hình đã được thay đổi ở nơi khác. Hãy xuất chỉnh sửa hiện tại để sao lưu, tải lại trang rồi nhập lại nếu cần.'});return;}
          const next=JSON.stringify(config,null,2)+'\n';await writeFile(path.join(root,'..','.site-config.backup.json'),previous,'utf8');
          const temporary=configPath+'.'+randomUUID()+'.tmp';await writeFile(temporary,next,'utf8');await rename(temporary,configPath);json(200,{revision:revisionOf(next)});
        }finally{writing=false;}return;
      }
      if(!['GET','HEAD'].includes(req.method)){json(405,{error:'Phương thức không được hỗ trợ.'});return;}
      const filename=path.resolve(root,'.'+(normalizedPath==='/'?'/index.html':normalizedPath));const relative=path.relative(root,filename);
      if(relative.startsWith('..')||path.isAbsolute(relative)||relative.split(path.sep).some(part=>part.startsWith('.'))){json(403,{error:'Không có quyền truy cập.'});return;}
      if(/^admin(?:\.|\/|\\)/i.test(relative)){json(404,{error:'Không tìm thấy tệp.'});return;}
      const data=await readFile(filename);res.writeHead(200,{'Content-Type':types[path.extname(filename)]||'application/octet-stream'});res.end(req.method==='HEAD'?undefined:data);
    }catch(error){json(error.status|| (error.code==='ENOENT'?404:500),{error:error.status?error.message:error.code==='ENOENT'?'Không tìm thấy tệp.':'Không xử lý được yêu cầu. Kiểm tra cấu hình máy chủ.'});}
  });
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const port=Number(process.env.BSR_PREVIEW_PORT||4173);
  const url='http://127.0.0.1:'+port;
  const server=createPreviewServer();
  server.on('error',async error=>{
    if(error.code==='EADDRINUSE'){
      let existingBSR=false;
      try{
        const response=await fetch(url,{signal:AbortSignal.timeout(2000)});
        const page=await response.text();
        existingBSR=response.ok&&page.includes('BSR Digital')&&page.includes('id="org-chart"');
      }catch{}
      if(existingBSR){
        console.log('BSR đã chạy trên cổng '+port+'. Không cần khởi động thêm.\nTrang giới thiệu: '+url+'\nQuản trị: '+url+'/admin');
        return;
      }
      console.error('Cổng '+port+' đang được một tiến trình khác sử dụng. Hãy chọn cổng khác bằng biến BSR_PREVIEW_PORT hoặc dừng đúng tiến trình đang giữ cổng.');
    }else console.error('Không thể khởi động máy chủ BSR: '+error.message);
    process.exitCode=1;
  });
  server.listen(port,'127.0.0.1',()=>console.log('Local: '+url+'\nQuản trị (yêu cầu đăng nhập): '+url+'/admin'));
}
