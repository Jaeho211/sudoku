const geometries=new Map();
export function geometry(size=6){
 if(![6,9].includes(size))throw Error('지원하지 않는 보드 크기');
 if(geometries.has(size))return geometries.get(size);
 const boxRows=size===6?2:3,boxCols=3,units=[];
 for(let r=0;r<size;r++)units.push(Array.from({length:size},(_,c)=>r*size+c));
 for(let c=0;c<size;c++)units.push(Array.from({length:size},(_,r)=>r*size+c));
 for(let r=0;r<size;r+=boxRows)for(let c=0;c<size;c+=boxCols)units.push(Array.from({length:size},(_,k)=>(r+Math.floor(k/boxCols))*size+c+k%boxCols));
 const peerLists=Array.from({length:size*size},(_,i)=>[...new Set(units.filter(u=>u.includes(i)).flat())].filter(j=>j!==i));
 const g={size,boxRows,boxCols,units,peerLists};geometries.set(size,g);return g;
}
export const units=geometry().units;
export const boardSize=b=>Math.sqrt(b.length);
export const peers=(i,size=6)=>geometry(size).peerLists[i];
export const candidates=(b,i)=>b[i]?[]:Array.from({length:boardSize(b)},(_,k)=>k+1).filter(n=>!peers(i,boardSize(b)).some(j=>b[j]===n));
export const conflicts=b=>b.flatMap((n,i)=>n&&peers(i,boardSize(b)).some(j=>b[j]===n)?[i]:[]);
export function steps(b){
 if(conflicts(b).length)return [];
 const size=boardSize(b),out=[];
 b.forEach((n,i)=>{const c=candidates(b,i);if(!n&&c.length===1)out.push({type:'single',cell:i,value:c[0],unit:peers(i,size)});});
 geometry(size).units.forEach((u,k)=>{for(let n=1;n<=size;n++){if(u.some(i=>b[i]===n))continue;const places=u.filter(i=>!b[i]&&candidates(b,i).includes(n));if(places.length===1&&candidates(b,places[0]).length>1)out.push({type:'hidden',cell:places[0],value:n,unit:u,unitIndex:k});}});
 return out;
}
export function logicalSolve(board){const b=[...board];for(let k=0;k<b.length;k++){if(b.every(Boolean))return b;const s=steps(b)[0];if(!s)return null;b[s.cell]=s.value;}return b.every(Boolean)?b:null;}
export function countSolutions(board,limit=2){if(conflicts(board).length)return 0;const b=[...board];let count=0;function walk(){if(count>=limit)return;let best=-1,opts=[];for(let i=0;i<b.length;i++)if(!b[i]){const c=candidates(b,i);if(!c.length)return;if(best<0||c.length<opts.length){best=i;opts=c;if(c.length===1)break;}}if(best<0){count++;return;}for(const n of opts){b[best]=n;walk();}b[best]=0;}walk();return count;}
export const shuffle=a=>{const b=[...a];for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]];}return b;};
export function generate(size=6,blanks=size===6?24:40){
 const {boxRows,boxCols}=geometry(size),nums=shuffle(Array.from({length:size},(_,i)=>i+1));
 const rows=shuffle(Array.from({length:size/boxRows},(_,i)=>i)).flatMap(g=>shuffle(Array.from({length:boxRows},(_,i)=>g*boxRows+i)));
 const cols=shuffle(Array.from({length:size/boxCols},(_,i)=>i)).flatMap(g=>shuffle(Array.from({length:boxCols},(_,i)=>g*boxCols+i)));
 const b=rows.flatMap(r=>cols.map(c=>nums[(r*boxCols+Math.floor(r/boxRows)+c)%size]));let removed=0;
 for(const i of shuffle([...b.keys()])){if(removed>=blanks)break;const n=b[i];b[i]=0;if(countSolutions(b)!==1||!logicalSolve(b))b[i]=n;else removed++;}return b;
}
export function lesson(type,unitKind=null,size=6){for(let k=0;k<150;k++){const b=generate(size,size===6?26:46),s=steps(b).find(s=>s.type===type&&(!unitKind||(s.unitIndex<size?'row':s.unitIndex<size*2?'column':'box')===unitKind));if(s)return {board:b,step:s};}throw Error('학습 문제 생성에 실패했습니다');}
