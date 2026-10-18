export class Node{
 constructor(tag='div',attrs={}){this.tagName=tag;this.attrs={...attrs};this.children=[];this.parent=null;this._text='';this._html='';this.value=attrs.value||'';this.disabled='disabled'in attrs;this.checked='checked'in attrs;this.dataset={};for(const[k,v]of Object.entries(attrs))if(k.startsWith('data-'))this.dataset[k.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=v;}
 set innerHTML(html){this._html=html;this.children=[];parse(String(html),this)}get innerHTML(){return this._html}
 set textContent(s){this._text=String(s);this.children=[]}get textContent(){return this._text}
 appendChild(n){n.parent=this;this.children.push(n);return n}
 setAttribute(k,v){this.attrs[k]=v}removeAttribute(k){delete this.attrs[k]}
 querySelector(s){return this.querySelectorAll(s)[0]||null}
 querySelectorAll(s){let out=[];for(const n of this.children){if(match(n,s))out.push(n);out.push(...n.querySelectorAll(s))}return out}
}
function match(n,s){if(s[0]==='#')return n.attrs.id===s.slice(1);let a=s.match(/^(\w+)?\[([^=\]]+)(?:=["']?([^\]"']+)["']?)?\]$/);if(a)return(!a[1]||n.tagName===a[1])&&(a[2]in n.attrs)&&(a[3]===undefined||n.attrs[a[2]]===a[3]);return n.tagName===s}
function parse(html,root){const stack=[root],voids=new Set(['input','img','hr','br','meta','link']);const re=/<\/?([\w-]+)\b([^>]*)>/g;let m;while(m=re.exec(html)){const[tag,attrsText]=[m[1],m[2]];if(m[0][1]==='/'){const idx=stack.map(n=>n.tagName).lastIndexOf(tag);if(idx>0)stack.length=idx;continue}const attrs={};const ar=/([\w:-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;let a;while(a=ar.exec(attrsText))attrs[a[1]]=a[2]??a[3]??a[4]??'';const n=new Node(tag,attrs);stack.at(-1).appendChild(n);if(!voids.has(tag)&&!m[0].endsWith('/>'))stack.push(n)}}
