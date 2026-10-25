import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,mkdir,readdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {randomBytes} from 'node:crypto';
import {defaults,clone,validateConfig,safeUrl} from '../dist/data-model.mjs';
import {createPreviewServer} from '../preview.mjs';
import {createPasswordRecord,readPasswordRecord,verifyPassword} from '../admin/auth.mjs';
test('organization rejects cycles, duplicate IDs and missing parents',()=>{
  const data=clone(defaults);data.people.push({...data.people[0],id:'child',name:'Test child',parentId:'le-xuan-hien'});
  assert.equal(validateConfig(data).people[1].parentId,'le-xuan-hien');
  const cycle=clone(data);cycle.people[0].parentId='child';assert.throws(()=>validateConfig(cycle),/vòng lặp/);
  const missing=clone(data);missing.people[1].parentId='absent';assert.throws(()=>validateConfig(missing),/không tồn tại/);
  const duplicate=clone(data);duplicate.people[1].id='le-xuan-hien';assert.throws(()=>validateConfig(duplicate),/trùng/);
});
test('configuration rejects active URLs and malformed avatars',()=>{
  assert.equal(safeUrl('javascript:alert(1)'),'');
  const data=clone(defaults);data.people[0].avatar='data:image/svg+xml;base64,PHN2Zz4=';assert.throws(()=>validateConfig(data),/Ảnh/);
});
test('public build has no editor, setup endpoint or edit links',async()=>{
  const publicRoot=new URL('../dist/',import.meta.url);
  assert.equal((await readdir(publicRoot)).some(name=>name.startsWith('admin')||name.startsWith('auth')),false);
  for(const name of ['index.html','app.js'])assert.doesNotMatch(await readFile(new URL(name,publicRoot),'utf8'),/href\s*=\s*["'][^"']*admin/);
  assert.doesNotMatch(await readFile(new URL('data-model.mjs',publicRoot),'utf8'),/localStorage\.getItem/);
});
async function fixture(t,{configured=true,sessionTtlMs}={}){
  const folder=await mkdtemp(path.join(tmpdir(),'bsr-auth-test-'));const root=path.join(folder,'dist'),adminRoot=path.join(folder,'admin'),authPath=path.join(folder,'auth.json');
  await mkdir(root);await mkdir(adminRoot);
  await writeFile(path.join(root,'site-config.json'),JSON.stringify(defaults,null,2)+'\n');
  await writeFile(path.join(root,'index.html'),'<h1>Public page</h1>');
  await writeFile(path.join(adminRoot,'admin.html'),'PRIVATE_EDITOR');
  await writeFile(path.join(adminRoot,'admin.js'),'PRIVATE_SCRIPT');
  const password=randomBytes(24).toString('hex');
  if(configured)await writeFile(authPath,JSON.stringify(await createPasswordRecord(password)));
  const server=createPreviewServer({root,adminRoot,authPath,sessionTtlMs});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  t.after(()=>new Promise(resolve=>server.close(resolve)));
  const origin='http://127.0.0.1:'+server.address().port;
  const login=(value=password,requestOrigin=origin)=>fetch(origin+'/api/login',{method:'POST',redirect:'manual',headers:{Origin:requestOrigin,'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({password:value})});
  return {folder,root,authPath,password,origin,login,server};
}
test('no password configured means fail closed; public page still works',async t=>{
  const f=await fixture(t,{configured:false});
  assert.match(await(await fetch(f.origin+'/admin')).text(),/Quản trị đang được khóa/);
  assert.equal((await fetch(f.origin+'/admin/assets/admin.js')).status,401);
  assert.equal((await fetch(f.origin+'/api/config',{method:'PUT'})).status,401);
  assert.equal((await f.login()).status,503);
  assert.equal((await fetch(f.origin+'/')).status,200);
});
test('unauthenticated direct paths and API writes are blocked',async t=>{
  const f=await fixture(t);
  for(const route of ['/admin','/admin/','/admin.html','/%61dmin.html']){
    const response=await fetch(f.origin+route);const html=await response.text();assert.match(html,/Đăng nhập quản trị/);assert.doesNotMatch(html,/PRIVATE_EDITOR/);
  }
  for(const route of ['/admin/assets/admin.js','/admin/assets/admin.css','/admin/auth.mjs'])assert.equal((await fetch(f.origin+route)).status,401);
  assert.equal((await fetch(f.origin+'/admin.js')).status,404);
  assert.equal((await fetch(f.origin+'/api/config',{method:'PUT',headers:{Origin:f.origin,'Content-Type':'application/json'},body:JSON.stringify(defaults)})).status,401);
  assert.equal((await f.login('wrong')).status,401);
  assert.equal((await f.login(f.password,'https://external.example')).status,403);
});
test('authenticated save persists; stale and cross-origin writes blocked; logout revokes session',async t=>{
  const f=await fixture(t);const response=await f.login();assert.equal(response.status,303);
  const header=response.headers.get('set-cookie');assert.match(header,/HttpOnly/);assert.match(header,/SameSite=Strict/);const cookie=header.split(';')[0];
  assert.equal(await(await fetch(f.origin+'/admin',{headers:{Cookie:cookie}})).text(),'PRIVATE_EDITOR');
  assert.equal(await(await fetch(f.origin+'/admin/assets/admin.js',{headers:{Cookie:cookie}})).text(),'PRIVATE_SCRIPT');
  assert.equal((await fetch(f.origin+'/admin/auth.mjs',{headers:{Cookie:cookie}})).status,404);
  const initial=await(await fetch(f.origin+'/api/config')).json();const updated=clone(defaults);updated.organization.introduction='Persisted test content';
  const save=(origin=f.origin,revision=initial.revision)=>fetch(f.origin+'/api/config',{method:'PUT',headers:{Origin:origin,Cookie:cookie,'Content-Type':'application/json','If-Match':revision},body:JSON.stringify(updated)});
  assert.equal((await save('https://external.example')).status,403);assert.equal((await save()).status,200);
  assert.equal(JSON.parse(await readFile(path.join(f.root,'site-config.json'),'utf8')).organization.introduction,'Persisted test content');
  assert.equal((await save()).status,409);
  const logout=await fetch(f.origin+'/api/logout',{method:'POST',headers:{Origin:f.origin,Cookie:cookie}});assert.equal(logout.status,200);
  assert.equal((await save()).status,401);assert.equal((await fetch(f.origin+'/api/admin-session',{headers:{Cookie:cookie}})).status,401);
});
test('password changes invalidate existing sessions and passwords are salted',async t=>{
  const f=await fixture(t);const initial=await readPasswordRecord(f.authPath);assert.ok(await verifyPassword(f.password,initial));assert.equal(await verifyPassword('incorrect',initial),false);
  const response=await f.login();const cookie=response.headers.get('set-cookie').split(';')[0];
  const next=await createPasswordRecord(f.password);assert.notEqual(initial.hash,next.hash);await writeFile(f.authPath,JSON.stringify(next));
  assert.equal((await fetch(f.origin+'/api/admin-session',{headers:{Cookie:cookie}})).status,401);
  assert.doesNotMatch(await readFile(f.authPath,'utf8'),new RegExp(f.password));
});
test('sessions expire and login attempts are limited',async t=>{
  const f=await fixture(t,{sessionTtlMs:1});const response=await f.login();const cookie=response.headers.get('set-cookie').split(';')[0];
  await new Promise(resolve=>setTimeout(resolve,10));
  assert.equal((await fetch(f.origin+'/api/admin-session',{headers:{Cookie:cookie}})).status,401);
  for(let i=0;i<5;i++)assert.equal((await f.login('invalid-password')).status,401);
  assert.equal((await f.login()).status,429);
});
