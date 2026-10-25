import {createServer} from 'node:http';
import {readFile,writeFile,rename} from 'node:fs/promises';
import {createHash,randomUUID} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {validateConfig} from './dist/data-model.mjs';
const defaultRoot=fileURLToPath(new URL('./dist/',import.meta.url));
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg'};
const revisionOf=content=>createHash('sha256').update(content).digest('hex');
export function createPreviewServer({root=defaultRoot}={}){
  const configPath=path.join(root,'site-config.json');let writing=false;
  return createServer(async(req,res)=>{
    function json(status,body){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(body));}
    try{
      const host=req.headers.host||'';
      if(!/^(127\.0\.0\.1|localhost|\[::1\]):\d+$/.test(host)){json(403,{error:'Máy chủ chỉ chấp nhận truy cập local.'});return;}
      const requestPath=decodeURIComponent(new URL(req.url,'http://'+host).pathname);
      if(requestPath==='/api/config'){
        if(req.method==='GET'){const content=await readFile(configPath,'utf8');json(200,{config:validateConfig(JSON.parse(content)),revision:revisionOf(content)});return;}
        if(req.method!=='PUT'){json(405,{error:'Phương thức không được hỗ trợ.'});return;}
        if(req.headers.origin!=='http://'+host||req.headers['sec-fetch-site']==='cross-site'){json(403,{error:'Chỉ có thể lưu từ trang cấu hình trên máy này.'});return;}
        if(!(req.headers['content-type']||'').startsWith('application/json')){json(415,{error:'Dữ liệu phải ở định dạng JSON.'});return;}
        let size=0;const chunks=[];for await(const chunk of req){size+=chunk.length;if(size>8*1024*1024){json(413,{error:'Cấu hình vượt quá giới hạn 8 MB.'});return;}chunks.push(chunk);}
        let config;try{config=validateConfig(JSON.parse(Buffer.concat(chunks).toString('utf8')));}catch(error){json(400,{error:error.message});return;}
        if(writing){json(409,{error:'Đang có thao tác lưu khác. Hãy thử lại.'});return;}
        writing=true;
        try{
          const previous=await readFile(configPath,'utf8');if(req.headers['if-match']!==revisionOf(previous)){json(409,{error:'Cấu hình đã được thay đổi ở nơi khác. Hãy xuất bản chỉnh sửa hiện tại để sao lưu, tải lại trang rồi nhập lại nếu cần.'});return;}
          const next=JSON.stringify(config,null,2)+'\n';
          const backup=path.join(root,'..','.site-config.backup.json');
          await writeFile(backup,previous,'utf8');
          const temporary=configPath+'.'+randomUUID()+'.tmp';await writeFile(temporary,next,'utf8');await rename(temporary,configPath);
          json(200,{revision:revisionOf(next)});
        }finally{writing=false;}return;
      }
      if(!['GET','HEAD'].includes(req.method)){json(405,{error:'Phương thức không được hỗ trợ.'});return;}
      const filename=path.resolve(root,'.'+(requestPath==='/'?'/index.html':requestPath));
      const relative=path.relative(root,filename);
      if(relative.startsWith('..')||path.isAbsolute(relative)||relative.split(path.sep).some(part=>part.startsWith('.'))){json(403,{error:'Không có quyền truy cập.'});return;}
      const data=await readFile(filename);
      res.writeHead(200,{'Content-Type':types[path.extname(filename)]||'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
      res.end(req.method==='HEAD'?undefined:data);
    }catch(error){json(error.code==='ENOENT'?404:500,{error:error.code==='ENOENT'?'Không tìm thấy tệp.':'Không xử lý được yêu cầu. Kiểm tra quyền đọc/ghi thư mục dự án.'});}
  });
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const port=Number(process.env.BSR_PREVIEW_PORT||4173);
  createPreviewServer().listen(port,'127.0.0.1',()=>console.log('Local: http://127.0.0.1:'+port+'\nCấu hình: http://127.0.0.1:'+port+'/admin.html'));
}
