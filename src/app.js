import {generate,steps,peers,conflicts,candidates,geometry,advancedSteps} from './engine.js';
import {stages,stageBoard,isUnlocked} from './stages.js';
const $=id=>document.getElementById(id),progressKey='sudoku-stages-v1';
let mode='play',size=6,state,stageIndex=0,selected=-1,memo=false,history=[],hintStep=null,hintLevel=0,completed=false,errorClues=[];
const storage={read(k){try{return JSON.parse(localStorage.getItem(k));}catch{return null;}},write(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch{}}};
let progress=storage.read(progressKey)||{};
progress={cleared:Number.isInteger(progress.cleared)?Math.max(0,Math.min(stages.length,progress.cleared)):0,active:progress.active||null};
const playKey=n=>n===6?'sudoku-discovery-v1':'sudoku-play-9-v1';
const advanced=()=>mode==='learn'&&!!stages[stageIndex].candidates;
const reductions=()=>!!hintStep?.removals;
const deductions=()=>advanced()?advancedSteps(state.board,state.notes):steps(state.board);
const example=()=>mode==='learn'&&stages[stageIndex].type!=='puzzle';
function valid(s,n){return s&&['board','givens'].every(k=>Array.isArray(s[k])&&s[k].length===n*n&&s[k].every(v=>Number.isInteger(v)&&v>=0&&v<=n))&&s.givens.every((v,i)=>!v||s.board[i]===v)&&!conflicts(s.givens).length&&Array.isArray(s.notes)&&s.notes.length===n*n&&s.notes.every(a=>Array.isArray(a)&&a.every(v=>Number.isInteger(v)&&v>=1&&v<=n));}
function makeState(board){return {givens:[...board],board:[...board],notes:board.map(()=>[]),hints:0};}
function save(){if(!state)return;if(mode==='play')storage.write(playKey(size),state);else{progress.active={index:stageIndex,state};storage.write(progressKey,progress);}}
function message(text,tone='neutral'){$('message').textContent=text;$('feedback').hidden=false;$('feedback').dataset.tone=tone;}
function reset(){selected=-1;memo=false;history=[];hintStep=null;hintLevel=0;completed=false;errorClues=[];$('success').replaceChildren();$('success').hidden=true;$('feedback').dataset.tone='neutral';}
function refreshHome(){
 $('stage-progress').textContent=`${progress.cleared} / ${stages.length} 클리어`;
 const nineOpen=progress.cleared>=10;
 $('learn').textContent='전체 '+stages.length+'단계 보기 ⌄';
 const allDone=progress.cleared===stages.length,next=allDone?null:stages[progress.cleared],resuming=!allDone&&progress.active?.index===progress.cleared&&valid(progress.active.state,next.size);
 $('next-stage-label').textContent=allDone?'탐험 완료':`${progress.cleared+1}단계 · ${resuming?'진행 중':'다음 도전'}`;
 $('next-stage-title').textContent=allDone?'9×9 문제 풀기가 열렸어요!':next.title;
 $('continue-stage').textContent=allDone?'9×9 문제 풀기 →':resuming?'이어서 배우기 →':`${progress.cleared+1}단계 시작하기 →`;
 $('continue-stage').onclick=()=>allDone?startPlay(9):startStage(progress.cleared);
 $('journey-dots').replaceChildren();stages.forEach((_,i)=>{const dot=document.createElement('span');dot.className=i<progress.cleared?'cleared':i===progress.cleared?'current':'';dot.textContent=i<progress.cleared?'✓':String(i+1);$('journey-dots').append(dot);});
 $('nine-badge').textContent=nineOpen?'열림':'잠김';
 $('stage-list').replaceChildren();stages.forEach((s,i)=>{const b=document.createElement('button');b.className='stage-card';b.disabled=!isUnlocked(i,progress.cleared);const title=document.createElement('strong'),desc=document.createElement('span');title.textContent=`${i+1}. ${s.title}${i<progress.cleared?' ✓':b.disabled?' 🔒':''}`;desc.textContent=s.description+(progress.active?.index===i&&i>=progress.cleared?' · 이어서 하기':'');b.append(title,desc);b.onclick=()=>startStage(i);$('stage-list').append(b);});
 $('play-9').disabled=progress.cleared<10;$('unlock-note').textContent=progress.cleared>=10?'✓ 9×9 문제 풀기가 열렸어요!':'10단계를 클리어하면 9×9가 열려요. 이후 중급 훈련도 이어가세요.';
 const s=storage.read(playKey(6));$('resume-label').textContent=valid(s,6)&&s.board.some((v,i)=>v!==s.givens[i])?'이어 풀기':'';
}
function home(){save();document.body.classList.remove('playing','learning');$('home').hidden=false;document.querySelector('header').hidden=false;$('game').hidden=true;$('lesson-picker').hidden=true;$('learn').setAttribute('aria-expanded','false');refreshHome();}
function enter(){document.body.classList.add('playing');document.body.classList.toggle('learning',mode==='learn');$('home').hidden=true;document.querySelector('header').hidden=true;$('game').hidden=false;$('tools').hidden=example();$('stage-title').hidden=mode!=='learn';$('stage-title').textContent=mode==='learn'?stages[stageIndex].title:'';$('mode-label').textContent=mode==='learn'?`${stageIndex+1} / ${stages.length}단계 · ${size}×${size}`:`문제 풀기 · ${size}×${size}`;$('new-top').textContent=mode==='learn'?'다시 시작':'새 문제';}
function unitName(s){return s.unitIndex<size?'가로줄':s.unitIndex<size*2?'세로줄':'작은 상자';}
function question(){if(hintStep.type==='memo')return '테두리 칸에 가능한 숫자를 모두 메모해보세요. 같은 가로줄·세로줄·상자의 숫자는 제외해요.';
 if(reductions())return explain(hintStep)+' 강조된 바깥 칸에서 해당 후보를 눌러 지워보세요.';
 return hintStep.type==='single'?'테두리 칸에 들어갈 숫자를 찾아보세요.':`강조된 ${unitName(hintStep)}에서 ${hintStep.value}이 들어갈 자리를 찾아보세요.`;}
function restoreExample(){const s=stages[stageIndex];if(s.type==='memo'){hintStep={type:'memo',cell:state.givens.findIndex((n,i)=>!n&&candidates(state.givens,i).length>=3)};selected=hintStep.cell;memo=true;hintLevel=1;return true;}
 hintStep=(s.candidates?advancedSteps(state.givens):steps(state.givens)).find(t=>t.type===s.type&&(!s.kind||(t.unitIndex<size?'row':t.unitIndex<size*2?'column':'box')===s.kind));hintLevel=1;if(hintStep?.type==='single'||hintStep?.removals)selected=hintStep.cell;return !!hintStep;}
function startStage(index,restart=false){
 if(!isUnlocked(index,progress.cleared))return;save();mode='learn';stageIndex=index;size=stages[index].size;reset();
 const active=progress.active;
 if(!restart&&active?.index===index&&valid(active.state,size))state=active.state;
 else state=makeState(stageBoard(index).board);
 if((advanced()||stages[index].type==='memo')&&!state.candidateMode){state.notes=state.board.map((_,i)=>stages[index].type==='memo'?[]:candidates(state.board,i));state.candidateMode=true;}
 if(example()&&!restoreExample()){state=makeState(stageBoard(index).board);restoreExample();}
 enter();message(example()?(stageIndex===5?'9×9는 1~9를 쓰고 작은 상자는 3×3이에요. ':'')+question():`빈칸을 모두 채워 ${index+1}단계를 클리어해요. 막히면 힌트를 볼 수 있어요.`);
 if((example()&&reductions()&&hintStep.removals.every(r=>!state.notes[r.cell].includes(r.value)))||(example()&&hintStep.type==='memo'&&state.notes[hintStep.cell].length===candidates(state.givens,hintStep.cell).length)||(example()&&!reductions()&&hintStep.type!=='memo'&&state.board[hintStep.cell]===hintStep.value)||(!example()&&state.board.every(Boolean)&&!conflicts(state.board).length))finish();
 save();render();
}
function startPlay(n){if(n===9&&progress.cleared<10)return;save();mode='play';size=n;reset();const saved=storage.read(playKey(n));state=valid(saved,n)?saved:makeState(generate(n));state.hints=Number.isInteger(state.hints)?state.hints:0;enter();$('feedback').hidden=true;if(state.board.every(Boolean)&&!conflicts(state.board).length)finish();render();}
function evidence(s){if(s.source)return s.source;if(s.type==='memo')return peers(s.cell,size).filter(i=>state.board[i]);return s.type==='single'?peers(s.cell,size).filter(i=>state.board[i]):[...new Set(s.unit.filter(i=>!state.board[i]&&i!==s.cell).flatMap(i=>peers(i,size).filter(j=>state.board[j]===s.value)))];}
function render(){
 const g=geometry(size),bad=conflicts(state.board),related=selected>=0?peers(selected,size):[],clues=hintStep&&hintLevel>=2?evidence(hintStep):[];
 $('board').style.setProperty('--size',size);$('board').dataset.size=size;$('board').setAttribute('aria-label',`${size}×${size} 스도쿠 보드`);$('board').replaceChildren();
 state.board.forEach((n,i)=>{const b=document.createElement('button');b.className='cell';const row=Math.floor(i/size),col=i%size;
 for(const [cls,yes] of Object.entries({given:!!state.givens[i],related:related.includes(i),same:!!n&&selected>=0&&n===state.board[selected],clue:clues.includes(i)||(hintStep?.source?.includes(i)&&hintLevel>=1)||(hintStep?.type==='hidden'&&hintLevel>=1&&hintStep.unit.includes(i)),target:!!hintStep&&((['single','memo','locked','pair'].includes(hintStep.type)&&hintLevel>0)||hintLevel>=3)&&(i===hintStep.cell||reductions()&&hintStep.removals.some(r=>r.cell===i)),selected:i===selected,conflict:bad.includes(i),'error-clue':errorClues.includes(i),excluded:hintStep?.type==='hidden'&&hintLevel>=2&&hintStep.unit.includes(i)&&!n&&i!==hintStep.cell,solved:example()&&completed&&i===hintStep?.cell,'box-right':(col+1)%g.boxCols===0&&col<size-1,'box-bottom':(row+1)%g.boxRows===0&&row<size-1,'last-col':col===size-1,'last-row':row===size-1}))b.classList.toggle(cls,!!yes);
 b.setAttribute('aria-label',`${row+1}행 ${col+1}열, ${n||'빈칸'}${state.givens[i]?', 주어진 숫자':''}`);b.setAttribute('aria-pressed',String(i===selected));
 if(n)b.textContent=n;else{const notes=document.createElement('span');notes.className='notes';for(let k=1;k<=size;k++){const el=document.createElement('span');el.textContent=state.notes[i].includes(k)?k:'';notes.append(el);}b.append(notes);}
 b.onclick=()=>{if(completed)return;selected=i;errorClues=[];render();};$('board').append(b);});
 $('numbers').style.setProperty('--size',size);$('numbers').replaceChildren();for(let n=1;n<=size;n++){const b=document.createElement('button');b.textContent=n;b.setAttribute('aria-label',`${n} 입력`);b.onclick=()=>input(n);$('numbers').append(b);}
 $('numbers').style.visibility=completed?'hidden':'visible';$('tools').hidden=example()||completed;$('memo').textContent=advanced()?'후보 지우기':'메모';$('memo').classList.toggle('active',memo);$('memo').setAttribute('aria-pressed',String(memo));$('undo').disabled=!history.length;$('hint').hidden=completed;$('hint').textContent=example()?(hintLevel<3?'다음 설명 보기':'설명 다시 보기'):'힌트 보기';
}
function explain(s){if(s.type==='memo')return '이 칸의 후보는 '+candidates(state.givens,s.cell).join('·')+'이에요. 후보는 답을 확정하기 전의 메모예요.';
 if(s.type==='locked')return '이 상자에서 '+s.value+'의 후보가 한 줄에 모여 있어요. 그 줄의 상자 바깥에는 '+s.value+'이 들어갈 수 없어요.';
 if(s.type==='pair')return '강조된 두 칸의 후보는 둘 다 '+s.values.join('·')+'뿐이에요. 두 숫자가 이 두 칸을 차지하므로 같은 구역의 다른 칸에서는 지울 수 있어요.';
 return s.type==='single'?`같은 가로줄·세로줄·상자에 ${Array.from({length:size},(_,i)=>i+1).filter(n=>n!==s.value).join('·')}이 이미 있어요. 남는 숫자는 ${s.value}뿐이에요.`:`이 ${unitName(s)}에서 ${s.value}이 가능한 자리는 이 칸뿐이에요.`;}
function success(text,label,action){const p=document.createElement('p');p.textContent=text;const b=document.createElement('button');b.textContent=label;b.onclick=action;$('success').replaceChildren(p,b);$('success').hidden=false;}
function finish(){
 completed=true;
 if(mode==='learn'){
 progress.cleared=Math.max(progress.cleared,stageIndex+1);save();message(example()?'✓ 정답이에요!':'✓ 스테이지 클리어!','correct');
 const last=stageIndex===stages.length-1;
 success((example()?explain(hintStep):`빈칸을 모두 채웠어요. 힌트를 ${state.hints||0}번 사용했어요.`)+(last?' 모든 단계를 클리어했어요! 이제 9×9 문제를 풀 수 있어요.':''),last?'9×9 문제 풀기':`다음: ${stageIndex+2}단계`,()=>last?startPlay(9):startStage(stageIndex+1));
 }else{message('✓ 완성했어요!','correct');success(`빈칸 ${state.givens.filter(n=>!n).length}개를 채웠어요. 힌트를 ${state.hints||0}번 사용했어요.`,'다음 문제',newGame);}
}
function input(n){
 if(completed||n<0||n>size)return;
 if(selected<0){message('먼저 빈칸을 선택해주세요.');return;}if(state.givens[selected]){message('처음부터 주어진 숫자는 바꿀 수 없어요.');return;}
 if(example()&&(hintStep.type==='memo'||reductions())){
 if(hintStep.type==='memo'){
 if(selected!==hintStep.cell||!candidates(state.givens,selected).includes(n)){message('같은 줄·상자에 있는 숫자는 후보가 아니에요. 테두리 칸의 후보를 찾아보세요.','retry');return;}
 history.push(JSON.stringify({board:state.board,notes:state.notes}));const a=state.notes[selected];state.notes[selected]=a.includes(n)?a.filter(v=>v!==n):[...a,n].sort();
 if(state.notes[selected].length===candidates(state.givens,selected).length)finish();else message('가능한 후보를 더 찾아 메모해보세요.');
 }else{
 if(!hintStep.removals.some(r=>r.cell===selected&&r.value===n)||!state.notes[selected].includes(n)){message('강조된 칸에서 이 방법으로 제외할 수 있는 후보를 골라보세요.','retry');return;}
 history.push(JSON.stringify({board:state.board,notes:state.notes}));state.notes[selected]=state.notes[selected].filter(v=>v!==n);
 if(hintStep.removals.every(r=>!state.notes[r.cell].includes(r.value)))finish();else message('✓ 후보를 지웠어요! 강조된 나머지 칸도 살펴보세요.','correct');
 }save();render();return;
 }
 if(example()&&(n===0||selected!==hintStep.cell||n!==hintStep.value)){
 errorClues=peers(selected,size).filter(i=>state.board[i]===n&&n);
 if(hintStep.type==='single'&&selected!==hintStep.cell)message('이번에는 테두리로 표시한 칸을 풀어봐요.','retry');
 else if(hintStep.type==='hidden'&&!hintStep.unit.includes(selected))message(`강조된 ${unitName(hintStep)} 안에서 자리를 찾아보세요.`,'retry');
 else if(errorClues.length){const j=errorClues[0],where=Math.floor(j/size)===Math.floor(selected/size)?'가로줄':j%size===selected%size?'세로줄':'작은 상자';message(`여기에는 ${n}을 넣을 수 없어요. 같은 ${where}에 이미 ${n}이 있어요. 표시된 숫자를 살펴보세요.`,'retry');}
 else message(`이번에는 ${hintStep.value}이 들어갈 유일한 자리를 찾고 있어요. 강조된 구역을 다시 살펴보세요.`,'retry');render();return;
 }
 errorClues=[];history.push(JSON.stringify({board:state.board,notes:state.notes}));
 if(advanced()&&memo&&n){const step=deductions().find(s=>s.removals?.some(r=>r.cell===selected&&r.value===n));if(!step){history.pop();message('이 후보를 지울 근거를 더 찾아보세요. 힌트로 확인할 수 있어요.','retry');return;}state.notes[selected]=state.notes[selected].filter(v=>v!==n);hintStep=null;hintLevel=0;message('✓ 후보를 지웠어요. 새로 하나만 남은 칸을 찾아보세요.','correct');}
 else if(memo&&n){if(state.board[selected]){history.pop();message('메모는 빈칸에 적을 수 있어요.');return;}const a=state.notes[selected];state.notes[selected]=a.includes(n)?a.filter(v=>v!==n):[...a,n].sort();}
 else{state.board[selected]=n;state.notes[selected]=[];if(!n&&advanced())state.notes=state.board.map((_,i)=>candidates(state.board,i));if(n)peers(selected,size).forEach(i=>state.notes[i]=state.notes[i].filter(v=>v!==n));const bad=conflicts(state.board);
 if(example()&&n)finish();else{hintStep=null;hintLevel=0;if(bad.length)message('같은 가로줄·세로줄·상자에 겹치는 숫자가 있어요. 표시된 칸을 확인해보세요.','retry');else if(state.board.every(Boolean))finish();else if(mode==='play')$('feedback').hidden=true;else message('한 칸 채웠어요. 다음 단서를 찾아보세요.');}}
 save();render();
}
function newGame(){if(mode==='learn'){startStage(stageIndex,true);return;}reset();state=makeState(generate(size));$('feedback').hidden=true;save();render();}
$('home-back').onclick=home;$('new-top').onclick=()=>{if(!completed&&state.board.some((n,i)=>n!==state.givens[i])&&!confirm(mode==='learn'?'이 스테이지를 처음부터 다시 시작할까요?':'새 문제로 바꿀까요?'))return;newGame();};
$('learn').onclick=()=>{const open=$('lesson-picker').hidden;$('lesson-picker').hidden=!open;$('learn').setAttribute('aria-expanded',String(open));if(open)$('lesson-picker').scrollIntoView({behavior:'smooth',block:'start'});};$('play-6').onclick=()=>startPlay(6);$('play-9').onclick=()=>startPlay(9);
$('memo').onclick=()=>{memo=!memo;render();};$('erase').onclick=()=>input(0);$('undo').onclick=()=>{if(!history.length||completed)return;Object.assign(state,JSON.parse(history.pop()));hintStep=null;hintLevel=0;if(example())restoreExample();message('마지막 입력을 되돌렸어요.');save();render();};
$('hint').onclick=()=>{errorClues=[];if(conflicts(state.board).length){message('먼저 겹치는 숫자를 수정해보세요.');return;}
 if(!hintStep){hintStep=deductions()[0];if(!hintStep){message('현재 입력을 다시 확인해보세요. 되돌리기로 앞선 선택을 살펴볼 수 있어요.');return;}}
 hintLevel=Math.min(3,hintLevel+1);state.hints=(state.hints||0)+1;
 if(reductions()){memo=true;message(question());}
 else if(hintStep.type==='memo')message(explain(hintStep));
 else if(hintLevel===1)message(question());else if(hintLevel===2)message(hintStep.type==='single'?'노란색 숫자를 살펴보세요. 같은 가로줄·세로줄·상자에 있는 숫자는 제외할 수 있어요.':`× 표시 칸은 같은 가로줄·세로줄·상자에 이미 ${hintStep.value}이 있어서 제외돼요. 노란색 ${hintStep.value}을 확인해보세요.`);
 else{selected=hintStep.cell;message(`테두리 칸에는 ${hintStep.value}이 들어가요. ${explain(hintStep)} 직접 숫자를 눌러 채워보세요.`);}save();render();};
document.addEventListener('keydown',e=>{if($('game').hidden)return;if(e.target.tagName==='BUTTON'&&['Enter',' '].includes(e.key))return;if(/^[1-9]$/.test(e.key)&&Number(e.key)<=size)input(Number(e.key));if(['Backspace','Delete'].includes(e.key)){e.preventDefault();input(0);}const d={ArrowLeft:-1,ArrowRight:1,ArrowUp:-size,ArrowDown:size}[e.key];if(d&&!completed){e.preventDefault();selected=selected<0?0:Math.max(0,Math.min(state.board.length-1,selected+d));render();}});
refreshHome();
