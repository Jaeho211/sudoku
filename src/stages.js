import {shuffle,steps,generate,advancedSteps,candidates,advancedSolve,peers} from './engine.js';
const examples={"6-single":[0,0,0,0,6,0,1,0,0,4,0,0,0,0,0,0,0,0,0,5,0,2,0,4,0,4,5,0,3,2,0,0,0,0,0,0],"6-row":[0,1,0,0,0,0,3,0,0,0,2,0,0,0,5,0,0,0,1,0,0,2,0,0,4,0,0,0,0,0,0,3,1,5,0,0],"6-column":[0,0,0,1,0,0,0,0,4,0,0,5,0,0,0,0,3,4,0,2,0,0,1,0,0,4,0,0,0,0,1,0,2,0,0,0],"6-box":[0,0,1,2,0,5,0,0,0,0,6,0,0,0,0,3,0,1,4,0,0,0,0,0,0,0,0,0,2,0,0,0,4,0,0,3],"9-single":[3,4,6,8,9,0,7,5,0,0,7,5,6,0,0,2,8,0,0,0,8,0,1,7,4,0,0,0,1,0,0,0,0,9,0,5,5,0,2,7,0,0,0,0,8,8,0,0,0,5,9,0,7,0,4,6,0,0,0,0,0,0,0,0,0,3,0,7,5,0,0,0,0,0,9,1,0,0,8,0,0],"9-row":[0,0,4,0,1,5,0,3,0,0,0,2,7,9,4,6,1,0,0,0,5,8,0,2,0,0,0,0,4,9,0,7,0,0,6,0,0,5,0,0,6,3,0,0,0,6,0,0,0,8,0,5,0,0,0,9,0,0,4,0,0,0,6,0,1,7,0,5,0,9,2,0,0,0,0,9,0,8,1,0,7],"9-column":[5,0,2,6,4,0,0,0,0,1,3,0,0,2,0,0,0,0,0,0,0,0,8,0,0,0,7,9,0,0,0,1,4,0,0,8,0,0,0,7,0,0,9,6,2,7,0,5,0,0,2,0,0,0,0,6,3,0,0,1,2,9,5,0,0,0,2,9,5,0,3,6,2,0,0,0,3,0,8,7,0],"9-box":[0,0,3,0,0,2,6,0,0,0,4,6,0,9,0,0,0,8,8,2,0,0,0,4,0,0,0,4,7,8,5,1,0,0,0,0,0,0,9,8,0,7,0,0,1,1,0,5,9,0,3,8,0,0,0,9,2,0,0,0,0,0,0,6,0,4,1,0,5,0,9,7,0,0,0,2,0,0,0,8,6]};
export const advancedExamples={"locked": [0, 0, 0, 0, 5, 0, 7, 0, 0, 0, 0, 6, 0, 0, 0, 0, 0, 0, 0, 8, 9, 1, 0, 0, 0, 0, 6, 0, 3, 0, 0, 0, 0, 0, 0, 0, 5, 0, 7, 0, 0, 1, 2, 0, 0, 8, 0, 0, 0, 0, 4, 0, 6, 0, 0, 0, 0, 6, 0, 8, 0, 0, 2, 0, 7, 0, 0, 0, 0, 0, 0, 0, 9, 1, 0, 3, 0, 0, 0, 7, 8], "pair": [0, 0, 0, 0, 5, 0, 0, 0, 9, 0, 5, 0, 7, 0, 0, 1, 0, 0, 0, 8, 0, 1, 0, 3, 0, 0, 0, 0, 3, 4, 0, 6, 0, 0, 0, 0, 0, 0, 0, 8, 0, 1, 2, 0, 0, 0, 9, 0, 0, 0, 0, 5, 0, 0, 3, 0, 0, 6, 0, 8, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 4, 5, 0, 0, 2, 3, 4, 0, 0, 0, 0], "medium": [0, 0, 0, 0, 0, 6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 3, 7, 8, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 3, 0, 0, 9, 1, 2, 3, 0, 5, 0, 7, 0, 0, 0, 0, 7, 0, 0, 0, 2, 6, 0, 0, 9, 0, 0, 3, 0, 5, 9, 1, 2, 0, 0, 0, 0, 0, 8]};
export const stages=[
 {size:6,type:'single',title:'한 칸에 남는 숫자',description:'6×6 · 한 칸의 후보를 좁혀요'},
 {size:6,type:'hidden',kind:'row',title:'가로줄에서 유일한 자리',description:'6×6 · 숫자가 들어갈 자리를 찾아요'},
 {size:6,type:'hidden',kind:'column',title:'세로줄에서 유일한 자리',description:'6×6 · 세로줄에도 같은 방법을 써요'},
 {size:6,type:'hidden',kind:'box',title:'상자에서 유일한 자리',description:'6×6 · 작은 상자의 단서를 모아요'},
 {size:6,type:'puzzle',blanks:18,title:'6×6 완성 도전',description:'진짜 문제 한 판 · 배운 두 방법으로 완성해요'},
 {size:9,type:'single',title:'9×9의 첫 한 칸',description:'숫자는 1~9 · 상자는 3×3으로 커져요'},
 {size:9,type:'hidden',kind:'row',title:'9×9 가로줄 살펴보기',description:'9×9 · 가로줄에서 숫자의 자리를 찾아요'},
 {size:9,type:'hidden',kind:'column',title:'9×9 세로줄 살펴보기',description:'9×9 · 세로줄에서 숫자의 자리를 찾아요'},
 {size:9,type:'hidden',kind:'box',title:'9×9 상자 살펴보기',description:'9×9 · 3×3 상자에서 자리를 찾아요'},
 {size:9,type:'puzzle',blanks:32,title:'쉬운 9×9 완성 도전',description:'기본 과정 완성 · 9×9 문제 풀기 해금!'} ,
 {size:9,type:'memo',title:'후보 숫자 적기',description:'가능한 숫자를 빠짐없이 메모해요'},
 {size:9,type:'single',candidates:true,title:'후보가 하나로 남는 칸',description:'후보 메모에서 다음 한 칸을 찾아요'},
 {size:9,type:'hidden',kind:'box',candidates:true,title:'후보 속 유일한 자리',description:'상자에서 한 숫자의 자리를 좁혀요'},
 {size:9,type:'puzzle',blanks:12,candidates:true,guided:true,basicCandidates:true,title:'후보로 다음 칸 이어 풀기',description:'12칸 · 답을 넣으면 다른 칸의 후보가 어떻게 줄어드는지 배워요'},
 {size:9,type:'hidden',kind:'row',candidates:true,title:'가로줄의 후보 비교하기',description:'후보가 여러 개여도 한 숫자의 자리가 하나면 답이에요'},
 {size:9,type:'hidden',kind:'column',candidates:true,title:'세로줄의 후보 비교하기',description:'같은 숫자의 후보를 세로줄 전체에서 찾아요'},
 {size:9,type:'puzzle',blanks:24,candidates:true,basicCandidates:true,title:'후보만 보고 쉬운 한 판',description:'24칸 · 후보 하나와 유일한 자리를 번갈아 찾아요'},
 {size:9,type:'locked',candidates:true,prepared:true,one:true,title:'상자와 줄: 후보 하나 지우기',description:'도움받기 · 한 칸의 후보만 지워요'},
 {size:9,type:'locked',candidates:true,prepared:true,title:'상자와 줄: 이어서 연습',description:'단서가 정리된 보드에서 같은 방법을 반복해요'},
 {size:9,type:'locked',candidates:true,title:'상자와 줄: 직접 적용',description:'빈칸이 많은 보드에서도 근거를 찾아요'},
 {size:9,type:'puzzle',blanks:40,candidates:true,title:'후보를 보며 한 판 완성',description:'복습 · 기본 두 방법으로 완성할 수 있어요'},
 {size:9,type:'pair',candidates:true,prepared:true,one:true,title:'같은 후보 두 칸: 하나 지우기',description:'도움받기 · 두 칸이 차지하는 숫자를 알아봐요'},
 {size:9,type:'pair',candidates:true,prepared:true,title:'같은 후보 두 칸: 이어서 연습',description:'단서가 정리된 보드에서 다른 후보도 지워요'},
 {size:9,type:'pair',candidates:true,title:'같은 후보 두 칸: 직접 적용',description:'같은 구역의 두 칸을 찾아 후보를 지워요'},
 {size:9,type:'puzzle',candidates:true,bridge:true,title:'중급 퍼즐 마무리 연습',description:'앞부분이 풀린 문제 · 남은 12칸을 완성해요'},
 {size:9,type:'puzzle',candidates:true,title:'중급 9×9 완성 도전',description:'배운 방법을 합쳐 추측 없이 한 판을 완성해요'}
];
export const isUnlocked=(index,cleared)=>Number.isInteger(index)&&index>=0&&index<stages.length&&index<=cleared;
export function stageBoard(index){
 const stage=stages[index];if(!stage)throw Error('잘못된 스테이지');
 if(['memo','locked','pair'].includes(stage.type)||(stage.type==='puzzle'&&stage.candidates&&!stage.blanks)){
 const mapping=shuffle(Array.from({length:9},(_,i)=>i+1));
 const board=advancedExamples[stage.type==='puzzle'?'medium':stage.type==='memo'?'pair':stage.type].map(n=>n?mapping[n-1]:0);
 let notes=board.map((_,i)=>candidates(board,i));
 if(stage.prepared){
 // Keep the teaching pattern visible while filling unrelated easy cells.
 for(let k=0;k<81;k++){
 const move=steps(board).find(move=>{const next=[...board];next[move.cell]=move.value;return advancedSteps(next).some(s=>s.type===stage.type);});
 if(!move)break;board[move.cell]=move.value;
 }
 notes=board.map((_,i)=>candidates(board,i));
 }
 if(stage.bridge){
 for(const move of advancedSolve(board).trace){
 if(board.filter(n=>!n).length<=12)break;
 if(move.removals)move.removals.forEach(({cell,value})=>notes[cell]=notes[cell].filter(n=>n!==value));
 else{board[move.cell]=move.value;notes[move.cell]=[];peers(move.cell,9).forEach(i=>notes[i]=notes[i].filter(n=>n!==move.value));}
 }
 }
 const step=stage.type==='memo'?{type:'memo',cell:board.findIndex((n,i)=>!n&&candidates(board,i).length>=3)}:stage.type==='puzzle'?null:advancedSteps(board,notes).find(s=>s.type===stage.type);
 if(stage.one)step.removals=step.removals.slice(0,1);
 return {board,step,notes};
 }
 if(stage.type==='puzzle')return {board:generate(stage.size,stage.blanks),step:null};
 const mapping=shuffle(Array.from({length:stage.size},(_,i)=>i+1));
 const board=examples[`${stage.size}-${stage.kind||'single'}`].map(n=>n?mapping[n-1]:0);
 const step=steps(board).find(s=>s.type===stage.type&&(!stage.kind||(s.unitIndex<stage.size?'row':s.unitIndex<stage.size*2?'column':'box')===stage.kind));
 if(!step)throw Error('학습 예제에 단서가 없습니다');return {board,step};
}
