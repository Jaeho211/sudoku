export const units=[];
for(let r=0;r<6;r++) units.push(Array.from({length:6},(_,c)=>r*6+c));
for(let c=0;c<6;c++) units.push(Array.from({length:6},(_,r)=>r*6+c));
for(let r=0;r<6;r+=2)for(let c=0;c<6;c+=3)units.push(Array.from({length:6},(_,k)=>(r+Math.floor(k/3))*6+c+k%3));
export const peers=i=>[...new Set(units.filter(u=>u.includes(i)).flat())].filter(j=>j!==i);
export const candidates=(b,i)=>b[i]?[]:[1,2,3,4,5,6].filter(n=>!peers(i).some(j=>b[j]===n));
export const conflicts=b=>b.flatMap((n,i)=>n&&peers(i).some(j=>b[j]===n)?[i]:[]);
export function steps(b){
 if(conflicts(b).length)return [];
 const out=[];
 b.forEach((n,i)=>{const c=candidates(b,i);if(!n&&c.length===1)out.push({type:'single',cell:i,value:c[0],unit:peers(i)});});
 units.forEach((u,k)=>{for(let n=1;n<=6;n++){if(u.some(i=>b[i]===n))continue;const places=u.filter(i=>!b[i]&&candidates(b,i).includes(n));if(places.length===1&&candidates(b,places[0]).length>1)out.push({type:'hidden',cell:places[0],value:n,unit:u,unitIndex:k});}});
 return out;
}
export function logicalSolve(board){const b=[...board];for(let k=0;k<36;k++){if(b.every(Boolean))return b;const s=steps(b)[0];if(!s)return null;b[s.cell]=s.value;}return b.every(Boolean)?b:null;}
export function countSolutions(board,limit=2){if(conflicts(board).length)return 0;const b=[...board];let count=0;function walk(){if(count>=limit)return;let best=-1,opts=[];for(let i=0;i<36;i++)if(!b[i]){const c=candidates(b,i);if(!c.length)return;if(best<0||c.length<opts.length){best=i;opts=c;}}if(best<0){count++;return;}for(const n of opts){b[best]=n;walk();}b[best]=0;}walk();return count;}
const shuffle=a=>a.map(v=>({v,r:Math.random()})).sort((a,b)=>a.r-b.r).map(x=>x.v);
export function generate(){const nums=shuffle([1,2,3,4,5,6]);const b=Array.from({length:36},(_,i)=>nums[(Math.floor(i/6)*3+Math.floor(Math.floor(i/6)/2)+i%6)%6]);for(const i of shuffle([...b.keys()])){const n=b[i];b[i]=0;if(countSolutions(b)!==1||!logicalSolve(b))b[i]=n;}return b;}
export function lesson(type,unitKind=null){for(let k=0;k<150;k++){const b=generate(),s=steps(b).find(s=>s.type===type&&(!unitKind||(s.unitIndex<6?'row':s.unitIndex<12?'column':'box')===unitKind));if(s)return {board:b,step:s};}throw Error('학습 문제 생성에 실패했습니다');}
