import {randomBytes,scrypt as scryptCallback,timingSafeEqual,createHash} from 'node:crypto';
import {promisify} from 'node:util';
import {readFile} from 'node:fs/promises';
const scrypt=promisify(scryptCallback);
export async function createPasswordRecord(password){
  if(typeof password!=='string'||password.length<12||password.length>256)throw new Error('Mật khẩu cần từ 12 đến 256 ký tự.');
  const salt=randomBytes(32).toString('hex');const hash=await scrypt(password,salt,64);
  return {version:1,salt,hash:hash.toString('hex')};
}
export async function readPasswordRecord(authPath){
  try{const raw=await readFile(authPath,'utf8');const record=JSON.parse(raw);
    if(record.version!==1||!/^[a-f0-9]{64}$/.test(record.salt)||!/^[a-f0-9]{128}$/.test(record.hash))return null;
    return {...record,fingerprint:createHash('sha256').update(raw).digest('hex')};
  }catch{return null;}
}
export async function verifyPassword(password,record){
  if(!record||typeof password!=='string'||password.length>256)return false;
  const actual=await scrypt(password,record.salt,64);
  return timingSafeEqual(Buffer.from(record.hash,'hex'),actual);
}
export function loginPage({configured,error=''}){
  const esc=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  return '<!DOCTYPE html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Đăng nhập quản trị · BSR Digital</title><link rel="stylesheet" href="/styles.css"><link rel="stylesheet" href="/brand.css"><style>body{min-height:100vh;background:#f0f4f2;display:grid;place-items:center;padding:24px}.login{width:min(440px,100%);padding:36px;background:#fff;border:1px solid #d7e4db;border-radius:12px;box-shadow:0 16px 50px #233a4210}.login img{width:68px;height:72px;object-fit:contain;margin-bottom:25px}h1{font-size:26px;margin-bottom:14px}p{font-size:13px;color:#69728b}label{display:block;font-size:12px;margin:25px 0 8px}input{width:100%;padding:12px;border:1px solid #b8ccc0;border-radius:5px;font:inherit}button{width:100%;margin-top:20px;background:#2e9150;color:#fff}.error{color:#a0322b;margin-top:18px}a{display:block;margin-top:25px;font-size:12px;color:#3e478e}code{display:block;margin:20px 0;padding:12px;background:#f2f5f3;font-size:14px;overflow-wrap:anywhere}</style></head><body><main class="login"><img src="/logoBSR.png" alt="Petrovietnam BSR"><h1>'+ (configured?'Đăng nhập quản trị':'Quản trị đang được khóa')+'</h1><p>'+ (configured?'Nhập mật khẩu quản trị trên máy để chỉnh sửa nội dung.':'Chưa thiết lập mật khẩu. Trong thư mục dự án, chạy lệnh sau để tự tạo mật khẩu quản trị:')+'</p>'+ (configured?'<form method="post" action="/api/login"><label for="password">Mật khẩu quản trị</label><input id="password" name="password" type="password" autocomplete="current-password" required maxlength="256"><button class="button" type="submit">Đăng nhập</button></form>':'<code>node setup-admin.mjs</code><p>Sau khi thiết lập xong, tải lại trang này. Trang giới thiệu vẫn hoạt động bình thường.</p>')+(error?'<p class="error" role="alert">'+esc(error)+'</p>':'')+'<a href="/">← Về trang giới thiệu</a></main></body></html>';
}
