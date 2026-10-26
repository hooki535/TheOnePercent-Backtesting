const test=require('node:test'),assert=require('node:assert/strict'),F=require('../assets/backtest-frames.js'),E=require('../assets/backtest-workspace.js'),fs=require('node:fs'),crypto=require('node:crypto'),path=require('node:path');
const start=Date.UTC(2026,7,11)/1000;
const bars=Array.from({length:200},(_,i)=>({t:start+i*60,o:100+i,h:102+i,l:99+i,c:101+i}));
test('old history requests retain the chosen UTC date for server-side context loading',()=>{
 assert.equal(F.historyStart('', '1m'),'');
 assert.equal(F.historyStart('2022-06-15T12:00','1m'),'2022-06-15T12:00');
 assert.equal(F.historyStart('2022-06-15T12:00','1H'),'2022-06-15T12:00');
 assert.throws(()=>F.historyStart('invalid','1m'));
});
test('timeframes aggregate the revealed prefix and never consume a future high or close',()=>{
 const s={interval:'1m',candles:bars,cursor:7},p=F.project(s,'5m');assert.equal(p.bars.length,2);assert.deepEqual(p.bars[0],{t:start,o:100,h:106,l:99,c:105});assert.deepEqual(p.bars[1],{t:start+300,o:105,h:109,l:104,c:108});
 const changed=bars.map((b,i)=>i>7?{...b,h:999999,c:999999}:b);assert.deepEqual(F.project({...s,candles:changed},'5m').bars,p.bars);
});
test('source and aggregated drawing coordinates round trip without moving their saved anchors',()=>{
 const s={interval:'1m',candles:bars,cursor:119},p=F.project(s,'15m');for(const i of [0,7.3,33,99,119,133])assert.ok(Math.abs(p.toBase(p.toDisplay(i))-i)<1e-9);
 assert.equal(F.available({...s,interval:'1H'},'15m'),false);assert.equal(F.available({...s,interval:'1H'},'4H'),true);assert.equal(F.seconds('1m'),60);assert.equal(F.seconds('1M'),2678400);assert.equal(F.available({...s,interval:'1W'},'1M'),false);
});
test('UTC weeks start Monday and months start on their actual calendar boundary',()=>{
 assert.equal(new Date(F.bucket(Date.UTC(2026,7,16)/1000,'1W')*1000).toISOString(),'2026-08-10T00:00:00.000Z');assert.equal(new Date(F.bucket(start,'1M')*1000).toISOString(),'2026-08-01T00:00:00.000Z');
});
test('sparse daily charts suggest a useful revealed timeframe without revealing future prices',()=>{
 const extended=Array.from({length:7000},(_,i)=>({t:start+i*60,o:1,h:2,l:.5,c:1})),s={interval:'1m',candles:extended,cursor:1443,viewTimeframe:'1D'};
 const c=F.coverage(s);assert.equal(c.candles,2);assert.equal(c.recommended,'45m');assert.equal(c.revealed,extended[1443].t);
 const futureChanged=extended.map((b,i)=>i>s.cursor?{...b,h:999999}:b);assert.deepEqual(F.coverage({...s,candles:futureChanged}),c);
 assert.equal(F.coverage({...s,viewTimeframe:'1m'}).recommended,null);assert.equal(F.coverage({...s,cursor:0}).recommended,null);
});
test('timeframe preferences and channel settings survive single and portfolio backups',()=>{
 const options={symbol:'EURUSD',interval:'1m',startBalance:10000,multiplier:1,fee:0,slippage:0};const s=E.createSession(options,bars);s.viewTimeframe='15m';s.annotations=[{id:'channel',type:'channel',points:[{i:10,p:110},{i:20,p:120}],offset:4,dash:'dashed'}];const restored=E.restore(E.snapshot(s));assert.equal(restored.viewTimeframe,'15m');assert.equal(restored.annotations[0].offset,4);assert.equal(restored.annotations[0].dash,'dashed');
 const p=E.createPortfolio(options,[{symbol:'EURUSD',interval:'1m',candles:bars},{symbol:'GBPUSD',interval:'1m',candles:bars}]);p.viewTimeframe='4H';assert.equal(E.restore(E.snapshot(p)).viewTimeframe,'4H');
});
test('minute archives retain their original per-pair values and match their attributed manifest',()=>{
 const dir=path.join(__dirname,'../assets/backtesting/data'),m=JSON.parse(fs.readFileSync(path.join(dir,'forex-minute-manifest.json')));assert.equal(m.datasets.length,7);assert.equal(m.license,'CC-BY-SA-4.0');
 for(const d of m.datasets){const data=fs.readFileSync(path.join(dir,d.file));assert.equal(crypto.createHash('sha256').update(data).digest('hex'),d.sha256);const rows=E.parseCSV(data.toString());assert.equal(rows.length,d.bars);assert.ok(rows.length>6000);assert.equal(rows[0].t%60,0);}
});

test('earlier display context fixes sparse daily charts without changing saved trades or replay indexes',()=>{
 const history=Array.from({length:3000},(_,i)=>({t:start+(i-2400)*3600,o:100,h:102,l:99,c:101}));
 const s=E.createSession({symbol:'EURUSD',interval:'1H',startBalance:10000,multiplier:1},history.slice(2400));
 E.placeOrder(s,{side:'long',quantity:1,stop:99,target:102});E.step(s);
 const before=E.snapshot(s),oldDaily=F.project(s,'1D').bars.length;F.setContext(s,history.slice(0,2400));
 assert.ok(oldDaily<6);assert.ok(F.project(s,'1D').bars.length>=100);
 assert.deepEqual(E.snapshot(s),before);assert.deepEqual(E.snapshot(E.restore(before)),before);
 for(const key of ['1H','4H','1D']){const p=F.project(s,key);for(const index of [0,20,80,s.cursor])assert.ok(Math.abs(p.toBase(p.toDisplay(index))-index)<1e-8);assert.ok(p.bars.every(b=>b.t<=s.candles[s.cursor].t));}
 const changed=structuredClone(s);changed.candles=changed.candles.map((b,i)=>i>s.cursor?{...b,h:1e9,c:1e9}:b);F.setContext(changed,history.slice(0,2400));assert.deepEqual(F.project(changed,'1D').bars,F.project(s,'1D').bars);
 assert.throws(()=>F.setContext(s,[history[2400]]),/before the saved dataset/);
 assert.throws(()=>F.setContext(s,[history[1],history[0]]),/ordered/);
});

test('chart context stays isolated to its portfolio market and never enters a backup',()=>{
 const s=E.createPortfolio({startBalance:10000,multiplier:1,interval:'1m'},[{symbol:'EURUSD',candles:bars},{symbol:'GBPUSD',candles:bars}]);
 const old=E.snapshot(s),earlier=bars.slice(0,50).map(b=>({...b,t:b.t-3000}));F.setContext(s,earlier);assert.equal(F.context(s).length,50);
 E.selectMarket(s,'GBPUSD');assert.equal(F.context(s).length,0);E.selectMarket(s,'EURUSD');assert.equal(F.context(s).length,50);assert.deepEqual(E.snapshot(s),old);
});
