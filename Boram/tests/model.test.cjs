const {test}=require('node:test');
const assert=require('node:assert/strict');
require('../dist/model.js');
const B=globalThis.Boram;
test('근무시간: 휴게 공제, 익일 퇴근, 입력 오류',()=>{
  assert.equal(B.duration('09:00','18:00',60),480);
  assert.equal(B.duration('22:00','06:00',30),450);
  assert.equal(B.duration('09:00','10:00',90),0);
  assert.equal(B.duration('25:00','18:00'),0);
  assert.equal(B.workMinutes({in:'09:00',out:'18:00',break:60,status:'결근'}),0);
  assert.equal(B.workMinutes({in:'09:00',out:'',status:'정상'}),0);
});
test('급여: 직원·월 분리, 결근 제외, 수당과 시간 수정 반영',()=>{
 const db={records:[
  {employee:'a',date:'2026-10-01',in:'09:00',out:'18:00',break:60,status:'정상'},
  {employee:'a',date:'2026-10-02',in:'09:00',out:'18:00',status:'결근'},
  {employee:'b',date:'2026-10-01',in:'09:00',out:'18:00',status:'정상'},
  {employee:'a',date:'2026-09-01',in:'09:00',out:'18:00',status:'정상'}
 ],payroll:{a_2026_10:{}}};
 db.payroll['a_2026-10']={weekly:20000,night:10000,other:5000,confirmed:true};
 const employee={id:'a',wage:12000};
 let p=B.payroll(db,employee,'2026-10');
 assert.equal(p.minutes,480);assert.equal(p.base,96000);assert.equal(p.total,131000);assert.equal(p.confirmed,true);
 db.records[0].out='17:00';assert.equal(B.payroll(db,employee,'2026-10').total,119000);
});
test('결원 중복 배정 제외 및 CSV 수식 문자열 방어',()=>{
 assert.deepEqual(B.coverage({required:4,employees:['a','a','b']}),{assigned:2,missing:2});
 assert.equal(B.coverage({required:1,employees:['a','b']}).missing,0);
 assert.equal(B.csvCell('=SUM(A1)'), '"\'=SUM(A1)"');
 assert.equal(B.csvCell('a"b'), '"a""b"');
});
test('샘플 데이터 관계와 현재 월 유지',()=>{
 const db=B.seed();assert.equal(db.employees.length,6);
 assert.ok(db.shifts.some(s=>s.date===B.today()));
 for(const r of db.records){assert.ok(db.shifts.some(s=>s.id===r.shiftId));assert.ok(db.employees.some(e=>e.id===r.employee));}
});
