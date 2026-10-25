import {mkdir,writeFile,rename,access} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {createPasswordRecord} from './admin/auth.mjs';
const dir=fileURLToPath(new URL('./.local/',import.meta.url));const target=path.join(dir,'admin-auth.json');
function passwordPrompt(label){
  if(!process.stdin.isTTY||!process.stdout.isTTY)throw new Error('Hãy chạy lệnh này trực tiếp trong PowerShell hoặc Terminal để nhập mật khẩu riêng tư.');
  return new Promise((resolve,reject)=>{
    let value='';process.stdout.write(label);process.stdin.setEncoding('utf8');process.stdin.setRawMode(true);process.stdin.resume();
    function done(error){process.stdin.removeListener('data',onData);process.stdin.setRawMode(false);process.stdin.pause();process.stdout.write('\n');error?reject(error):resolve(value);}
    function onData(chunk){for(const character of chunk){if(character==='\u0003'){done(new Error('Đã huỷ thiết lập.'));return;}if(character==='\r'||character==='\n'){done();return;}if(character==='\u007f'||character==='\b'){value=Array.from(value).slice(0,-1).join('');continue;}if(character>=' '&&value.length<257)value+=character;}}
    process.stdin.on('data',onData);
  });
}
try{
  const reset=process.argv.includes('--reset');let exists=false;try{await access(target);exists=true;}catch{}
  if(exists&&!reset)throw new Error('Đã có mật khẩu quản trị. Để thay đổi, chạy: node setup-admin.mjs --reset');
  console.log('Thiết lập mật khẩu quản trị local (12–256 ký tự). Mật khẩu không hiển thị khi nhập.');
  const password=await passwordPrompt('Mật khẩu mới: ');const confirmation=await passwordPrompt('Nhập lại mật khẩu: ');
  if(password!==confirmation)throw new Error('Hai mật khẩu không trùng khớp. Chưa thay đổi cấu hình.');
  const record=await createPasswordRecord(password);await mkdir(dir,{recursive:true});
  const content=JSON.stringify(record,null,2)+'\n';
  if(reset){const temporary=path.join(dir,'admin-auth.tmp');await writeFile(temporary,content,{mode:0o600});await rename(temporary,target);}
  else await writeFile(target,content,{flag:'wx',mode:0o600});
  console.log('Đã thiết lập mật khẩu. Mở http://127.0.0.1:4173/admin để đăng nhập.');
}catch(error){console.error(error.message);process.exitCode=1;}
