/* Standalone replay navigation. Account and workspace storage keys are preserved. */
(() => {
  'use strict';
  if (document.body.dataset.shell === 'none') return;
  const root=document.body.dataset.depth==='1'?'../':'', workspace=root+'pages/backtesting.html';
  const header=document.createElement('header');header.className='topbar';
  header.innerHTML='<div class="wrap nav-row"><a class="brand" href="'+root+'index.html"><span class="brand-mark">1%</span><span class="brand-name">TheOnePercent · Backtesting</span></a><nav class="nav-links" aria-label="Primary"><a href="'+workspace+'#sessions" aria-current="page">Workspace</a></nav><div class="nav-actions" id="replay-account"><a class="btn btn-quiet" href="'+root+'pages/login.html">Log in</a></div></div>';
  document.body.prepend(header);
  window.Cloud?.ready.then(user=>{
    if(!user)return;
    const actions=document.getElementById('replay-account');actions.replaceChildren();
    const name=document.createElement('span');name.textContent=user.email||'Signed in';name.className='replay-account-name';
    const logout=document.createElement('a');logout.href='#';logout.className='btn btn-quiet';logout.dataset.shellLogout='';logout.textContent='Log out';
    actions.append(name,logout);
  }).catch(()=>{});
})();
