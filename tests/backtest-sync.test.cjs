const test=require('node:test'),assert=require('node:assert/strict'),Sync=require('../assets/backtest-sync.js');
const storage=()=>{const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v))};};
function database(){
 const rows=new Map();let fail=false;
 return {rows,set fail(value){fail=value;},client:{from(){let mode='read',row,filters=[];
  const query={select(){return query;},eq(k,v){filters.push([k,v]);return query;},maybeSingle(){return execute();},insert(v){mode='insert';row=v;return query;},update(v){mode='update';row=v;return query;},then(ok,bad){return execute().then(ok,bad);}};
  async function execute(){if(fail)return {data:null,error:{code:'NETWORK'}};const user=filters.find(([k])=>k==='user_id')?.[1]||row?.user_id,key=filters.find(([k])=>k==='key')?.[1]||row?.key,id=user+'|'+key,found=rows.get(id);
   if(mode==='read')return {data:found||null,error:null};
   if(mode==='insert'&&found)return {data:null,error:{code:'23505'}};
   if(mode==='update'&&(!found||filters.some(([k,v])=>found[k]!==v)))return {data:[],error:null};
   rows.set(id,{...row});return {data:[{updated_at:row.updated_at}],error:null};}
  return query;}}};
}
function device(db,userId='user-a'){
 let state={schema:1,sessions:[],strategies:[]},status;
 const local=storage(),key='onepercent:backtesting:v1:'+userId;
 const sync=new Sync({client:db.client,userId,key,storage:local,getSnapshot:()=>state,applyRemote:raw=>{if(raw.schema!==1)throw Error('bad');state=raw;local.setItem(key,JSON.stringify(raw));},onStatus:(code,message)=>status={code,message}});
 return {sync,local,key,get state(){return state;},set state(v){state=v;},get status(){return status;},save(){local.setItem(key,JSON.stringify(state));sync.schedule();}};
}
test('account sessions save and resume on a second device without copying guests',async()=>{
 const db=database(),a=device(db);await a.sync.start();a.state.sessions.push({id:'session-1'});a.save();await a.sync.flush();assert.equal(a.status.code,'saved');
 const b=device(db);await b.sync.start();assert.equal(b.state.sessions[0].id,'session-1');
 const other=device(db,'user-b');await other.sync.start();assert.equal(other.state.sessions.length,0);a.sync.stop();b.sync.stop();other.sync.stop();
});
test('concurrent devices cannot silently overwrite newer sessions',async()=>{
 const db=database(),a=device(db);await a.sync.start();a.state.sessions.push({id:'original'});a.save();await a.sync.flush();
 const b=device(db);await b.sync.start();a.state.sessions.push({id:'new-from-a'});a.save();await a.sync.flush();
 b.state.sessions.push({id:'new-from-b'});b.save();await b.sync.flush();assert.equal(b.status.code,'conflict');assert.equal(b.state.sessions.at(-1).id,'new-from-b');
 await b.sync.start({useRemote:true});assert.equal(b.state.sessions.at(-1).id,'new-from-a');a.sync.stop();b.sync.stop();
});
test('offline writes keep local data and retry safely',async()=>{
 const db=database(),a=device(db);await a.sync.start();db.fail=true;a.state.sessions.push({id:'offline'});a.save();await a.sync.flush();assert.equal(a.status.code,'error');assert.ok(a.local.getItem(a.key).includes('offline'));
 db.fail=false;await a.sync.start();assert.equal(a.status.code,'saved');assert.equal(db.rows.size,1);a.sync.stop();
});
test('untracked local and online work produce a conflict instead of data loss',async()=>{
 const db=database(),a=device(db);await a.sync.start();a.state.sessions.push({id:'online'});a.save();await a.sync.flush();
 const b=device(db);b.state.sessions.push({id:'local'});b.local.setItem(b.key,JSON.stringify(b.state));await b.sync.start();assert.equal(b.status.code,'conflict');assert.equal(b.state.sessions[0].id,'local');a.sync.stop();b.sync.stop();
});
test('stopped account adapter cannot upload later work',async()=>{
 const db=database(),a=device(db);await a.sync.start();a.sync.stop();a.state.sessions.push({id:'must-not-upload'});a.save();await a.sync.flush();assert.equal(db.rows.size,0);
});

test('research preparation and trade reflection travel through the existing account sync',async()=>{
 const E=require('../assets/backtest-workspace.js'),R=require('../assets/backtest-research.js'),bars=Array.from({length:180},(_,i)=>({t:1700000100+i*3600,o:100,h:102,l:99,c:101}));
 const s=E.createSession({symbol:'EURUSD',interval:'1H',startBalance:10000,multiplier:1},bars);E.placeOrder(s,{side:'long',quantity:2,stop:98,target:104});E.step(s);E.requestClose(s);E.step(s);
 s.research=R.clean({hypothesis:'Test the setup',entryPlan:'Wait for a close',riskPlan:'Keep the defined risk',nextAction:'Review another week'});s.reviews={[E.tradeKey(s.trades[0])]:R.cleanReview({notes:'Recorded after closing',emotion:'calm',followed:'yes',lesson:'Wait for the signal'})};
 const db=database(),a=device(db);await a.sync.start();a.state.sessions.push(E.snapshot(s));a.save();await a.sync.flush();
 const b=device(db);await b.sync.start();const restored=E.restore(b.state.sessions[0]);assert.deepEqual(restored.research,s.research);assert.deepEqual(restored.reviews,s.reviews);assert.equal(restored.cursor,s.cursor);assert.deepEqual(E.metrics(restored),E.metrics(s));
 const other=device(db,'user-b');await other.sync.start();assert.equal(other.state.sessions.length,0);a.sync.stop();b.sync.stop();other.sync.stop();
});
