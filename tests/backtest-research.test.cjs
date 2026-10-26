const test=require('node:test'),assert=require('node:assert/strict'),R=require('../assets/backtest-research.js'),E=require('../assets/backtest-workspace.js');
const bars=Array.from({length:180},(_,i)=>({t:1700000100+i*3600,o:100,h:102,l:99,c:101}));
function session(multi=false){const options={symbol:'EURUSD',interval:'1H',startBalance:10000,multiplier:1};return multi?E.createPortfolio(options,[{symbol:'EURUSD',candles:bars},{symbol:'GBPUSD',candles:bars}]):E.createSession(options,bars);}
function closeTrade(s){E.placeOrder(s,{side:'long',quantity:2,stop:98,target:104});E.step(s);E.requestClose(s);E.step(s);assert.equal(s.trades.length,1);}
const research={hypothesis:'Test a documented pullback.',entryPlan:'Wait for the signal to close.',invalidation:'No clear structure.',riskPlan:'Stop after two losses.',observation:'Waiting improved the entry.',nextAction:'Test the same rules on another week.'};

test('research brief and expanded trade reviews survive single and portfolio backups without changing executions',()=>{
 for(const multi of [false,true]){
  const s=session(multi);closeTrade(s);const trades=structuredClone(s.trades),cursor=s.cursor,metrics=E.metrics(s);
  s.research=R.clean(research);s.reviews={[E.tradeKey(s.trades[0])]:R.cleanReview({notes:'Original notes',emotion:'calm',thesis:'Pullback thesis',execution:'Followed the entry',lesson:'Wait',followed:'yes'})};
  const restored=E.restore(JSON.parse(JSON.stringify(E.snapshot(s))));assert.deepEqual(restored.research,research);assert.deepEqual(restored.reviews,s.reviews);assert.deepEqual(s.trades,trades);assert.deepEqual(restored.trades.map(({id,...t})=>t),trades.map(({id,...t})=>t));assert.equal(restored.cursor,cursor);assert.deepEqual(E.metrics(restored),metrics);
 }
});
test('old backups retain their original review notes and gain no invented research',()=>{
 const s=session();closeTrade(s);const key=E.tradeKey(s.trades[0]);s.reviews={[key]:{notes:'Legacy reflection',emotion:'neutral'}};
 const snapshot=E.snapshot(s),restored=E.restore(snapshot);assert.equal(restored.research,undefined);assert.deepEqual(restored.reviews,s.reviews);assert.equal(Object.hasOwn(E.snapshot(restored),'research'),false);
});
test('research normalization bounds notes and discards unrelated or invalid data',()=>{
 assert.equal(R.clean(null),undefined);assert.equal(R.clean([]),undefined);
 const clean=R.clean({hypothesis:'a'.repeat(9000),entryPlan:{html:'bad'},riskPlan:7,unexpected:'discard'});assert.equal(clean.hypothesis.length,2000);assert.equal(clean.entryPlan,'');assert.equal(clean.riskPlan,'');assert.equal(Object.hasOwn(clean,'unexpected'),false);
 const review=R.cleanReview({notes:'b'.repeat(9000),emotion:'unknown',followed:'guaranteed',thesis:'c'.repeat(9000),image:'not stored'});assert.equal(review.notes.length,4000);assert.equal(review.thesis.length,2000);assert.equal(review.emotion,'neutral');assert.equal(Object.hasOwn(review,'followed'),false);assert.equal(Object.hasOwn(review,'image'),false);
});
test('workspace totals count actual reviewed trades, not unrelated review rows or empty submissions',()=>{
 const s=session();closeTrade(s);const key=E.tradeKey(s.trades[0]);s.reviews={unrelated:{notes:'Not a trade'},[key]:{notes:'',emotion:'neutral'}};assert.equal(R.reviewed(s,E.tradeKey),0);s.reviews[key].followed='partly';assert.equal(R.reviewed(s,E.tradeKey),1);
 s.research={hypothesis:' ',entryPlan:'Wait',riskPlan:'Defined risk'};assert.equal(R.brief(s).filled,2);assert.equal(R.brief(s).ready,false);s.research.hypothesis='Test a pullback';assert.equal(R.brief(s).ready,true);
});
test('a fresh attempt carries preparation but starts reflection empty',()=>{
 const clean=R.restart(research);assert.equal(clean.hypothesis,research.hypothesis);assert.equal(clean.riskPlan,research.riskPlan);assert.equal(clean.observation,'');assert.equal(clean.nextAction,'');assert.equal(R.restart(undefined),undefined);
});
