export const componentKinds={interface:'Giao diện',service:'Dịch vụ xử lý',data:'Lưu trữ dữ liệu',external:'Hệ thống bên ngoài'};
export function emptyArchitecture(){return {enabled:true,title:'Kiến trúc hệ thống CNTT',description:'Khám phá các tầng công nghệ, ứng dụng và luồng kết nối.',isSample:false,security:'',layers:[],systems:[],connections:[]};}
export function validateArchitecture(value){
  if(value===undefined)return emptyArchitecture();
  const fail=m=>{throw new Error('Kiến trúc: '+m);};
  const object=v=>{if(!v||typeof v!=='object'||Array.isArray(v))fail('nội dung không hợp lệ.');return v;};
  const txt=(v,label,max=200)=>typeof v==='string'&&v.length<=max?v:fail(label+' phải là văn bản tối đa '+max+' ký tự.');
  const named=(v,label,max=160)=>{const s=txt(v,label,max);if(!s.trim())fail('cần nhập '+label+'.');return s;};
  const bool=(v,label)=>typeof v==='boolean'?v:fail(label+' không hợp lệ.');
  const arr=(v,max,label)=>Array.isArray(v)&&v.length<=max?v:fail(label+' hỗ trợ tối đa '+max+' mục.');
  function identify(rows,label){const ids=new Set();for(const r of rows){object(r);const id=txt(r.id,'mã '+label,80);if(!/^[a-zA-Z0-9_-]+$/.test(id)||ids.has(id))fail('mã '+label+' bị trùng hoặc không hợp lệ.');ids.add(id);}return ids;}
  function links(rows,ids,max,label){arr(rows,max,label);identify(rows,label);return rows.map(r=>{if(!ids.has(r.source)||!ids.has(r.target))fail(label+' tham chiếu đến mục không tồn tại.');if(r.source===r.target)fail(label+' không được nối tới chính nó.');if(!['one-way','two-way'].includes(r.direction))fail('chiều kết nối không hợp lệ.');return {id:r.id,source:r.source,target:r.target,label:txt(r.label,'nội dung kết nối',200),protocol:txt(r.protocol,'giao thức',80),direction:r.direction};});}
  const a=object(value),rawLayers=arr(a.layers,12,'tầng'),layerIds=identify(rawLayers,'tầng');
  const layers=rawLayers.map(l=>({id:l.id,title:named(l.title,'tên tầng'),description:txt(l.description,'mô tả tầng',600)}));
  const rawSystems=arr(a.systems,80,'hệ thống'),systemIds=identify(rawSystems,'hệ thống');
  const systems=rawSystems.map(s=>{if(!layerIds.has(s.layerId))fail('tầng của ứng dụng không tồn tại.');const rawComponents=arr(s.components,40,'thành phần'),componentIds=identify(rawComponents,'thành phần');const components=rawComponents.map(c=>{if(!Object.hasOwn(componentKinds,c.kind))fail('loại thành phần không hợp lệ.');return {id:c.id,name:named(c.name,'tên thành phần'),kind:c.kind,description:txt(c.description,'mô tả thành phần',1000)};});return {id:s.id,layerId:s.layerId,name:named(s.name,'tên hệ thống'),description:txt(s.description,'mô tả hệ thống',2000),owner:txt(s.owner,'đơn vị phụ trách',160),status:txt(s.status,'trạng thái',80),components,connections:links(s.connections,componentIds,80,'kết nối thành phần')};});
  return {enabled:bool(a.enabled,'hiển thị'),title:named(a.title,'tiêu đề',180),description:txt(a.description,'mô tả',1200),isSample:bool(a.isSample,'nhãn minh hoạ'),security:txt(a.security,'bảo mật xuyên suốt',1200),layers,systems,connections:links(a.connections,systemIds,200,'kết nối hệ thống')};
}
