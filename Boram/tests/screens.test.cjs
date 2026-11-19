/* Node VM smoke checks of generated HTML and event handlers; not browser layout QA. */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
function app(){
 const nodes=new Map(),listeners={};
 const node=()=>({innerHTML:'',textContent:'',classList:{add(){},remove(){},toggle(){}},focus(){}});
 const storage=()=>{const m=new Map();return {getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,v),removeItem:k=>m.delete(k)}};
 const c={console,Date,Math,Set,Map,JSON,Number,String,Array,Object,Promise,URL,Blob,
  setTimeout:()=>0,clearTimeout(){},localStorage:storage(),sessionStorage:storage(),location:{hash:''},
  document:{querySelector:s=>{if(!nodes.has(s))nodes.set(s,node());return nodes.get(s)},addEventListener:(k,f)=>listeners[k]=f},
  addEventListener(){},scrollTo(){},navigator:{},FormData:class extends Map{constructor(form){super(Object.entries(form.values))}getAll(k){let v=this.get(k);return v===undefined?[]:Array.isArray(v)?v:[v]}}
 };
 c.window=c;c.globalThis=c;vm.createContext(c);
 for(const f of ['model.js','app.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../dist',f),'utf8'),c);
 return {c,nodes,run:s=>vm.runInContext(s,c),submit:async(kind,values)=>listeners.submit({target:{closest:()=>({dataset:{form:kind},values})},preventDefault(){}})};
}
test('로그인, 관리자·직원 각 화면과 근로조건 6개 탭 렌더',()=>{
 const a=app();assert.match(a.nodes.get('#app').innerHTML,/로그인/);
 for(const role of ['admin','employee']){
  a.run(`session={role:'${role}',employee:'e1'};state.role='${role}';`);
  for(const route of ['home','employees','employee/e1','schedule','records','payroll','conditions','leave','store','notifications','attendance']){
   a.c.location.hash='#/'+route;a.run('render()');assert.ok(a.nodes.get('#app').innerHTML.length>500,role+' '+route);
  }
  a.c.location.hash='#/conditions';
  for(const tab of ['conditions','fixed','insurance','leave','contracts','account']){a.run(`state.tab='${tab}';render()`);assert.doesNotMatch(a.nodes.get('#app').innerHTML,/undefined/);}
 }
});
test('근무기록 수정 → 급여 재계산 및 확정 해제 / 직원 수정 차단',async()=>{
 const a=app();a.run(`session={role:'admin',employee:'e1'};state.role='admin';db.records=[{id:'r1',shiftId:'s1',employee:'e1',date:B.month()+'-01',in:'09:00',out:'18:00',break:60,status:'정상',history:[]}];db.payroll['e1_'+B.month()]={confirmed:true};`);
 const before=a.run('B.payroll(db,current(),B.month()).total');
 await a.submit('record',{id:'r1',shiftId:'s1',employee:'e1',date:a.run("B.month()+'-01'"),in:'09:00',out:'17:00',break:'60',status:'정상',reason:'시간 정정'});
 assert.equal(a.run('B.payroll(db,current(),B.month()).total'),before-12000);
 assert.equal(a.run("db.payroll['e1_'+B.month()].confirmed"),false);
 a.run("state.role='employee'");
 await a.submit('allowances',{weekly:'99999',night:'0',other:'0'});
 assert.equal(a.run("db.payroll['e1_'+B.month()].weekly"),undefined);
});
test('고정 스케줄 재적용 시 중복 배정 없음, 취소 버튼은 제출하지 않음',()=>{
 const a=app();a.run("session={role:'admin',employee:'e1'};applyFixed()");
 const before=a.run('JSON.stringify(db.shifts)');a.run('applyFixed()');assert.equal(a.run('JSON.stringify(db.shifts)'),before);
 assert.match(a.run("btn('취소','close')"),/type="button"/);
});
