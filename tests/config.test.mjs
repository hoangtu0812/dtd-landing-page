import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,mkdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {defaults,clone,validateConfig,safeUrl} from '../dist/data-model.mjs';
import {createPreviewServer} from '../preview.mjs';
test('organization accepts hierarchy and rejects cycles, duplicate IDs and missing parents',()=>{
  const data=clone(defaults);
  data.people.push({...data.people[0],id:'child',name:'Test child',parentId:'le-xuan-hien'});
  assert.equal(validateConfig(data).people[1].parentId,'le-xuan-hien');
  const cycle=clone(data);cycle.people[0].parentId='child';assert.throws(()=>validateConfig(cycle),/vòng lặp/);
  const missing=clone(data);missing.people[1].parentId='absent';assert.throws(()=>validateConfig(missing),/không tồn tại/);
  const duplicate=clone(data);duplicate.people[1].id='le-xuan-hien';assert.throws(()=>validateConfig(duplicate),/trùng/);
});
test('configuration refuses active URLs, malformed avatars and unsupported schemas',()=>{
  assert.equal(safeUrl('javascript:alert(1)'),'');assert.equal(safeUrl('https://example.com/app'),'https://example.com/app');
  const data=clone(defaults);data.people[0].avatar='data:image/svg+xml;base64,PHN2Zz4=';assert.throws(()=>validateConfig(data),/Ảnh/);
  assert.throws(()=>validateConfig({...defaults,version:99}),/phiên bản/);
  const app=clone(defaults);app.applications=[{title:'Test',description:'',category:'',status:'',url:'javascript:alert(1)'}];assert.throws(()=>validateConfig(app),/https/);
});
test('local API saves atomically, survives restart, rejects stale and cross-origin writes',async()=>{
  const folder=await mkdtemp(path.join(tmpdir(),'bsr-config-test-'));const root=path.join(folder,'dist');await mkdir(root);
  const configFile=path.join(root,'site-config.json');const original=JSON.stringify(defaults,null,2)+'\n';await writeFile(configFile,original);
  await writeFile(path.join(root,'index.html'),'<h1>test</h1>');
  let server=createPreviewServer({root});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const origin='http://127.0.0.1:'+server.address().port;
  try{
    const initial=await (await fetch(origin+'/api/config')).json();
    const updated=clone(defaults);updated.organization.introduction='Persisted test content';
    const send=(body,rev,requestOrigin=origin)=>fetch(origin+'/api/config',{method:'PUT',headers:{'Content-Type':'application/json',Origin:requestOrigin,'If-Match':rev},body:JSON.stringify(body)});
    assert.equal((await send(updated,initial.revision,'https://untrusted.example')).status,403);
    assert.equal((await send(updated,initial.revision)).status,200);
    assert.equal(JSON.parse(await readFile(configFile,'utf8')).organization.introduction,'Persisted test content');
    assert.equal(await readFile(path.join(folder,'.site-config.backup.json'),'utf8'),original);
    assert.equal((await send(defaults,initial.revision)).status,409);
    const next=await (await fetch(origin+'/api/config')).json();const invalid=clone(updated);invalid.people[0].parentId=invalid.people[0].id;
    assert.equal((await send(invalid,next.revision)).status,400);
    assert.equal((await fetch(origin+'/%2e%2e%2f.site-config.backup.json')).status,403);
    assert.equal((await fetch(origin+'/index.html')).status,200);
  }finally{await new Promise(resolve=>server.close(resolve));}
  server=createPreviewServer({root});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  try{const data=await(await fetch('http://127.0.0.1:'+server.address().port+'/api/config')).json();assert.equal(data.config.organization.introduction,'Persisted test content');}finally{await new Promise(resolve=>server.close(resolve));}
});
