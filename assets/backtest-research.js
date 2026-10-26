/* Structured research notes. These annotations never change simulation rules or fills. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.BacktestResearch=api;})(typeof window==='object'?window:globalThis,function(){
 'use strict';
 const fields=[['hypothesis','What am I testing?'],['entryPlan','Entry conditions'],['invalidation','When is the setup invalid?'],['riskPlan','Risk and stopping plan'],['observation','What did I learn?'],['nextAction','One improvement for the next session']];
 const text=(value,max=2000)=>typeof value==='string'?value.slice(0,max):'';
 function clean(value){if(!value||typeof value!=='object'||Array.isArray(value))return undefined;return Object.fromEntries(fields.map(([key])=>[key,text(value[key])]));}
 function cleanReview(value){const v=value&&typeof value==='object'&&!Array.isArray(value)?value:{};return {notes:text(v.notes,4000),emotion:['confident','calm','neutral','anxious','frustrated'].includes(v.emotion)?v.emotion:'neutral',...Object.fromEntries(['thesis','execution','lesson'].filter(k=>typeof v[k]==='string').map(k=>[k,text(v[k])])),...(['yes','partly','no'].includes(v.followed)?{followed:v.followed}:{})};}
 function brief(session){const r=clean(session.research)||{};return {filled:['hypothesis','entryPlan','riskPlan'].filter(k=>r[k]?.trim()).length,ready:!!(r.hypothesis?.trim()&&r.entryPlan?.trim()&&r.riskPlan?.trim()),reflection:!!r.observation?.trim(),nextAction:r.nextAction||''};}
 function reviewed(session,tradeKey){return session.trades.filter(t=>{const r=session.reviews?.[tradeKey(t)];return r&&[r.notes,r.thesis,r.execution,r.lesson,r.followed].some(v=>typeof v==='string'&&v.trim());}).length;}
 function restart(value){const r=clean(value);return r?{...r,observation:'',nextAction:''}:undefined;}
 return {fields,clean,cleanReview,brief,reviewed,restart};
});
