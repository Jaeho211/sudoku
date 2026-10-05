import {stages,stageBoard,isUnlocked} from '../src/stages.js';
import test from 'node:test';import assert from 'node:assert/strict';import {generate,lesson,countSolutions,logicalSolve,conflicts,steps,candidates,units,geometry,peers,advancedSolve,advancedSteps} from '../src/engine.js';
test('6×6 units have correct geometry',()=>{assert.equal(units.length,18);assert.ok(units.every(u=>u.length===6&&new Set(u).size===6));});
test('generated puzzles are unique and solvable without guessing',()=>{for(let k=0;k<30;k++){const b=generate();assert.equal(countSolutions(b),1);const solution=logicalSolve(b);assert.ok(solution);assert.equal(conflicts(solution).length,0);assert.ok(b.some(n=>!n));}});
test('both lessons have truthful target reasoning',()=>{for(const type of ['single','hidden'])for(let k=0;k<20;k++){const {board,step:s}=lesson(type);assert.equal(s.type,type);assert.ok(candidates(board,s.cell).includes(s.value));if(type==='single')assert.equal(candidates(board,s.cell).length,1);else{assert.ok(candidates(board,s.cell).length>1);assert.deepEqual(s.unit.filter(i=>!board[i]&&candidates(board,i).includes(s.value)),[s.cell]);}}});
test('conflicts suppress hints and invalid boards have no solutions',()=>{const b=Array(36).fill(0);b[0]=2;b[1]=2;assert.deepEqual(conflicts(b),[0,1]);assert.deepEqual(steps(b),[]);assert.equal(countSolutions(b),0);});

test('hidden lessons cover rows, columns and boxes',()=>{for(const kind of ['row','column','box']){const {board,step}=lesson('hidden',kind);assert.equal(step.unitIndex<6?'row':step.unitIndex<12?'column':'box',kind);assert.deepEqual(step.unit.filter(i=>!board[i]&&candidates(board,i).includes(step.value)),[step.cell]);}});
test('9×9 geometry and easy puzzles are valid',()=>{const g=geometry(9);assert.equal(g.units.length,27);assert.ok(g.units.every(u=>u.length===9&&new Set(u).size===9));assert.equal(peers(40,9).length,20);for(let k=0;k<5;k++){const b=generate(9,32);assert.equal(b.length,81);assert.equal(b.filter(n=>!n).length,32);assert.equal(countSolutions(b),1);assert.ok(logicalSolve(b));}});
test('every stage has valid, truthful lessons or a solvable whole puzzle',()=>{for(let i=0;i<stages.length;i++){const s=stages[i],{board,step}=stageBoard(i);assert.equal(board.length,s.size*s.size);assert.equal(countSolutions(board),1);assert.ok(s.candidates||s.type==='memo'?advancedSolve(board):logicalSolve(board));if(['memo','locked','pair'].includes(s.type)){if(s.type==='memo')assert.ok(candidates(board,step.cell).length>=3);else {assert.ok(step.removals.length);assert.ok(step.removals.every(r=>candidates(board,r.cell).includes(r.value)));}continue;}if(s.type!=='puzzle'){assert.equal(step.type,s.type);assert.ok(candidates(board,step.cell).includes(step.value));if(s.type==='single')assert.equal(candidates(board,step.cell).length,1);else{assert.equal(step.unitIndex<s.size?'row':step.unitIndex<s.size*2?'column':'box',s.kind);assert.deepEqual(step.unit.filter(j=>!board[j]&&candidates(board,j).includes(step.value)),[step.cell]);}}}});
test('stages unlock in order and end with a 9×9 puzzle',()=>{assert.equal(isUnlocked(0,0),true);assert.equal(isUnlocked(1,0),false);assert.equal(isUnlocked(5,5),true);assert.equal(isUnlocked(6,5),false);assert.equal(isUnlocked(-1,0),false);assert.equal(isUnlocked(stages.length,stages.length),false);assert.equal(stages.at(-1).size,9);assert.equal(stages.at(-1).type,'puzzle');});

test('advanced reductions never eliminate the unique solution and medium requires both techniques',()=>{
 for(const index of [17,18,19,21,22,23,24,25])for(let k=0;k<8;k++){
 const {board}=stageBoard(index),solved=advancedSolve(board);assert.ok(solved);assert.equal(countSolutions(board),1);
 for(const step of solved.trace)if(step.removals)for(const r of step.removals)assert.notEqual(solved.board[r.cell],r.value);
 if(index===25){assert.ok(solved.trace.some(s=>s.type==='locked'));assert.ok(solved.trace.some(s=>s.type==='pair'));assert.equal(logicalSolve(board),null);}
 }
});
test('candidate reductions expose a new single and preserve their effect',()=>{
 const {board}=stageBoard(25),notes=board.map((_,i)=>candidates(board,i));let reductions=0;
 for(let k=0;k<300&&!board.every(Boolean);k++){const s=advancedSteps(board,notes)[0];assert.ok(s);
 if(s.removals){reductions++;s.removals.forEach(({cell,value})=>notes[cell]=notes[cell].filter(v=>v!==value));}
 else{board[s.cell]=s.value;notes[s.cell]=[];peers(s.cell,9).forEach(i=>notes[i]=notes[i].filter(v=>v!==s.value));}}
 assert.ok(board.every(Boolean));assert.ok(reductions>=2);assert.equal(conflicts(board).length,0);
});

test('gentle introduction retains patterns with fewer blanks and one removal',()=>{
 for(const [intro,full] of [[17,19],[21,23]])for(let k=0;k<5;k++){
 const a=stageBoard(intro),b=stageBoard(full);
 assert.equal(a.step.removals.length,1);
 assert.ok(a.board.filter(n=>!n).length<b.board.filter(n=>!n).length);
 assert.ok(advancedSteps(a.board,a.notes).some(s=>s.type===stages[intro].type));
 }
 const bridge=stageBoard(24);assert.equal(bridge.board.filter(n=>!n).length,12);
 assert.ok(advancedSolve(bridge.board));
});

test('candidate foundation comes before reductions and can be solved with basic placements',()=>{
 assert.equal(stages[13].guided,true);assert.equal(stages[14].kind,'row');assert.equal(stages[15].kind,'column');
 for(const index of [13,16])for(let k=0;k<5;k++){
 const {board}=stageBoard(index);assert.equal(board.filter(n=>!n).length,stages[index].blanks);
 assert.ok(logicalSolve(board));
 const notes=board.map((_,i)=>candidates(board,i));
 while(board.some(n=>!n)){
 const s=advancedSteps(board,notes).find(s=>!s.removals);assert.ok(s);
 board[s.cell]=s.value;notes[s.cell]=[];
 peers(s.cell,9).forEach(i=>notes[i]=notes[i].filter(n=>n!==s.value));
 assert.deepEqual(notes,board.map((_,i)=>candidates(board,i)));
 }
 }
 assert.equal(stages[17].type,'locked');
});
