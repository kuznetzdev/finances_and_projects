/**
 * Typography-only formatter for curated financial expressions.
 * It changes presentation, never the mathematical source or the data used in calculations.
 * All user/content characters are escaped before entering HTML.
 */
const SUB=/_([\p{L}\p{N}]+|\([^()]*\))/gu;
function atom(text,escape){
 const s=String(text||'');
 let output='',last=0;
 for(const match of s.matchAll(SUB)){
  output+=escape(s.slice(last,match.index));
  const sub=match[1].startsWith('(')?match[1].slice(1,-1):match[1];
  output+='<sub>'+escape(sub)+'</sub>';
  last=match.index+match[0].length;
 }
 return output+escape(s.slice(last));
}
function wrapped(text){
 if(!((text.startsWith('(')&&text.endsWith(')'))||(text.startsWith('[')&&text.endsWith(']'))))return false;
 let depth=0;const start=text[0],end=text[text.length-1];
 for(let i=0;i<text.length;i++){
  if(text[i]===start)depth++;
  if(text[i]===end){depth--;if(depth===0&&i!==text.length-1)return false;}
 }
 return depth===0;
}
function breakTop(expression,ops){
 const parts=[];let depth=0,start=0;
 for(let i=0;i<expression.length;i++){
  const ch=expression[i];
  if(ch==='('||ch==='[')depth++;
  else if(ch===')'||ch===']')depth=Math.max(depth-1,0);
  else if(depth===0&&i>start&&ops.includes(ch)){
   // Treat leading signs as unary, not as binary operators.
   const prev=expression.slice(start,i).trim();
   if(!prev||prev.endsWith('^')||prev.endsWith('/'))continue;
   parts.push({value:expression.slice(start,i).trim(),op:ch});
   start=i+1;
  }
 }
 if(parts.length)parts.push({value:expression.slice(start).trim(),op:null});
 return parts;
}
function math(text,escape,depth=0){
 const s=String(text??'').trim();
 if(!s)return '';
 if(depth>10)return atom(s,escape);
 const sums=breakTop(s,['+','−']);
 if(sums.length>1)return sums.map((part,i)=>math(part.value,escape,depth+1)+(part.op?'<span class="math-operator"> '+escape(part.op)+' </span>':'')).join('');
 const factors=breakTop(s,['×','/']);
 if(factors.length>1){
  let html=math(factors[0].value,escape,depth+1);
  for(let i=1;i<factors.length;i++){
   const op=factors[i-1].op;
   const right=math(factors[i].value,escape,depth+1);
   html=op==='/'?'<span class="math-fraction"><span class="math-num">'+html+'</span><span class="math-den">'+right+'</span></span>':html+'<span class="math-operator"> × </span>'+right;
  }
  return html;
 }
 // Power notation is always processed after multiplication/division.
 const powers=breakTop(s,['^']);
 if(powers.length===2){
  let exponent=powers[1].value;
  if(wrapped(exponent))exponent=exponent.slice(1,-1);
  return math(powers[0].value,escape,depth+1)+'<sup>'+atom(exponent,escape)+'</sup>';
 }
 if(wrapped(s))return '<span class="math-bracket">'+escape(s[0])+'</span>'+math(s.slice(1,-1),escape,depth+1)+'<span class="math-bracket">'+escape(s[s.length-1])+'</span>';
 return atom(s,escape);
}
function equation(expression){
 let depth=0;
 for(let i=0;i<expression.length;i++){
  const c=expression[i];
  if(c==='('||c==='[')depth++;
  else if(c===')'||c===']')depth=Math.max(0,depth-1);
  else if(!depth&&(c==='='||c==='≈'||c==='≤'||c==='≥')){
   return {left:expression.slice(0,i).trim(),symbol:c,right:expression.slice(i+1).trim()};
  }
 }
 return null;
}
export function formulaMarkup(expression,escape){
 const original=String(expression??'').trim();
 if(!original)return '';
 const parts=equation(original);
 if(!parts)return '<div class="financial-formula" role="math" aria-label="'+escape(original)+'"><span class="math-value">'+math(original,escape)+'</span></div>';
 return '<div class="financial-formula" role="math" aria-label="'+escape(original)+'"><span class="math-left">'+math(parts.left,escape)+'</span><span class="math-equals">'+escape(parts.symbol)+'</span><span class="math-value">'+math(parts.right,escape)+'</span></div>';
}
export function isFormulaLike(value){
 const s=String(value??'');
 return s.length<170 && /[=≈]/.test(s)&&/[×/^ΔΣ]/.test(s);
}
