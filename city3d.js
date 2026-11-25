import * as T from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';
export function createCity(host, onSelect, onFailure){
 const renderer=new T.WebGLRenderer({antialias:true,alpha:false,powerPreference:'low-power'});
 renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.setClearColor(0x17252b);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;
 const canvas=renderer.domElement;host.append(canvas);canvas.style.cssText='display:block;width:100%;height:100%;touch-action:none';canvas.setAttribute('aria-label','Interactive 3D civilization');
 const scene=new T.Scene(), camera=new T.OrthographicCamera(-30,30,30,-30,.1,250), target=new T.Vector3(0,0,0);
 scene.add(new T.HemisphereLight(0xc4e4ff,0x555043,2.2));const sun=new T.DirectionalLight(0xffe0ad,3);sun.position.set(-35,60,25);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-36,right:36,top:36,bottom:-36,near:1,far:130});sun.shadow.bias=-.0005;scene.add(sun);
 const mats=new Map(),geos=new Map();function material(c,e=0){const k=c+':'+e;if(!mats.has(k))mats.set(k,new T.MeshStandardMaterial({color:c,roughness:.78,metalness:.16,emissive:e,emissiveIntensity:e?.65:0}));return mats.get(k)}
 function mesh(p,g,c,x,y,z,e=0){const m=new T.Mesh(g,material(c,e));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;p.add(m);return m}
 function box(p,w,h,d,x,y,z,c,e=0){const k='b'+[w,h,d].join(',');if(!geos.has(k))geos.set(k,new T.BoxGeometry(w,h,d));return mesh(p,geos.get(k),c,x,y,z,e)}
 function cyl(p,r,h,x,y,z,c,r2=r,e=0){const k='c'+[r,h,r2].join(',');if(!geos.has(k))geos.set(k,new T.CylinderGeometry(r2,r,h,12));return mesh(p,geos.get(k),c,x,y,z,e)}
 const steel=0x53666b,dark=0x27383e,concrete=0x777b70,glass=0x55b6c8,gold=0xb89b58;
 box(scene,78,.7,78,0,-.5,0,0x494e3e);box(scene,46,.28,56,0,-.02,0,0x6b7268);
 for(const x of [-23,23])box(scene,.8,2.4,56,x,1.2,0,dark);
 for(const z of [-28,28])for(const x of [-14,14])box(scene,18,2.4,.8,x,1.2,z,dark);
 for(const x of [-23,23])for(let z=-27;z<=27;z+=9){box(scene,1.5,3,1.5,x,1.5,z,steel);box(scene,.45,.25,.45,x,3.15,z,gold,0xffba43)}
 for(const x of [-8,8])box(scene,2,.1,54,x,.18,0,0x333e40);
 for(const z of [-18,-6,6,18])box(scene,44,.1,2,0,.19,z,0x333e40);
 for(let z=-26;z<27;z+=3)for(const x of [-8,8])box(scene,.1,.03,1.2,x,.26,z,gold);
 for(let i=0;i<50;i++){const side=i%2?1:-1,x=side*(25+(i*7%10)),z=-35+(i*13%70);cyl(scene,.5+(i%3)*.2,.8,x,.4,z,0x62675b,.2)}
 const positions=[[0,-22],[-15,-12],[15,-12],[-15,0],[15,0],[0,-10],[0,2],[-15,12],[15,12],[-15,23],[0,15],[15,23],[0,25],[0,-30]];
 const buildings=new Map(), labels=new Map(), movers=[];let active=[],lastSig='',angle=Math.PI/5,zoom=1,frame=0,disposed=false,dirty=true;
 function makeBuilding(d,i,lv){const root=new T.Group();const [x,z]=positions[i];root.position.set(x,0,z);root.userData.id=d.id;scene.add(root);box(root,8,.4,7,0,.2,0,concrete);const h=1.8+Math.min(lv,12)*.28,c=lv?new T.Color(d.color).getHex():0x4c5555;
 const hall=(w,height,depth,xx=0,zz=0)=>{box(root,w,height,depth,xx,.4+height/2,zz,c);box(root,w+.25,.22,depth+.25,xx,.5+height,zz,steel);for(let j=-1;j<=1;j++)box(root,.55,.4,.06,xx+j*1.1,.85+height*.48,zz+depth/2+.04,glass,0x174d55)};
 if(!lv){box(root,5,.14,4,0,.49,0,dark);for(const xx of [-2.5,2.5])for(const zz of [-2,2])box(root,.28,.5,.28,xx,.7,zz,gold)}
 else switch(d.id){
 case 'core':hall(5,h+1.2,4);cyl(root,1.1,2.3,0,h+2.6,0,steel,.65);cyl(root,.5,1.3,0,h+4.3,0,glass,.15,0x1595c7);break;
 case 'reactor':case 'water':hall(3,h,4,-1.7);for(const xx of [1,2.6]){cyl(root,.75,h+1,xx,(h+1)/2+.4,0,c);cyl(root,.8,.2,xx,h+1.5,0,steel)}box(root,2.1,.25,.25,1.8,h+1.45,0,dark);break;
 case 'farm':for(const xx of [-2.4,0,2.4]){box(root,2,1.25,5,xx,1.05,0,0x648b62);for(let j=-1;j<2;j++)box(root,1.8,.1,.2,xx,1.74,j*1.6,0xb0c59c)}break;
 case 'lab':hall(5,h,4);{const dish=cyl(root,1.2,.25,1,h+1.2,-.5,steel,.7);dish.rotation.z=.45;cyl(root,.12,1.2,1,h+1.5,-.5,glass)}break;
 case 'med':hall(5,h,4);box(root,.7,.12,2.1,0,h+.65,0,0xe9d5c6);box(root,2.1,.12,.7,0,h+.65,0,0xe9d5c6);box(root,.42,.14,1.5,0,h+.73,0,0xb7463a);box(root,1.5,.14,.42,0,h+.73,0,0xb7463a);break;
 case 'forge':hall(5,h,4);for(const xx of [-1.7,1.7])cyl(root,.4,2,xx,h+1.35,-1.2,steel);box(root,1.7,.9,.1,0,.9,2.04,0xe69047,0x9a340a);break;
 case 'turret':cyl(root,1.6,1.2,0,1,0,steel);box(root,2,1.2,2,0,2,0,c);box(root,.3,.35,3,0,2.2,1.7,dark);break;
 case 'shield':cyl(root,1.9,.6,0,.7,0,steel);{const m=mesh(root,new T.SphereGeometry(1.5,16,10),glass,0,1.5,0,0x235e7a);geos.set('shield'+i+'-'+lv,m.geometry)}break;
 case 'wall':hall(6,1.9,2);for(let j=-2;j<=2;j++)box(root,.6,.7,.7,j*1.1,2.65,0,steel);break;
 case 'hangar':hall(6,h+1,5);box(root,3.8,h*.8,.12,0,1.3,2.6,dark);break;
 case 'quarters':hall(3,h+1,4,-1.6);hall(2.6,h*.8,3,1.7);break;
 case 'market':hall(5,h*.65,3);for(let j=-1;j<=1;j++)box(root,1.3,.2,1.4,j*1.6,h*.65+.85,1.9,gold);break;
 default:hall(6,h,4);box(root,3,1.1,.08,0,1,2.05,dark);}
 if(lv>=3)for(let j=0;j<Math.min(4,Math.floor(lv/3));j++)box(root,.65,.7,.65,-2.6+j*1.2,.8,-2.7,steel);
 return root;}
 function rover(x,z,i){const g=new T.Group();box(g,1.1,.55,1.8,0,.52,0,i?0x809d7a:gold);box(g,.8,.45,.8,0,1,-.2,steel);for(const xx of [-.58,.58])for(const zz of [-.55,.55])box(g,.25,.5,.5,xx,.3,zz,dark);box(g,.15,.14,.12,.34,.65,.95,0xe7d7a4,0xb88e44);scene.add(g);movers.push({g,x,z,i});}rover(-8,-15,0);rover(8,4,1);
 const overlay=document.createElement('div');overlay.className='city3labels';host.append(overlay);
 function update(data){const sig=JSON.stringify(data.map(d=>[d.id,d.lv,d.ready,d.busy]));if(sig===lastSig)return;lastSig=sig;active=data;for(const b of buildings.values())scene.remove(b);buildings.clear();overlay.replaceChildren();labels.clear();data.forEach((d,i)=>{const b=makeBuilding(d,i,d.lv);buildings.set(d.id,b);const label=document.createElement('button');label.className='city3label'+(d.ready?' ready':'')+(d.busy?' busy':'');label.textContent=d.name+' · '+(d.lv?'Lv '+d.lv:'Build')+(d.ready?' ↑':'')+(d.busy?' ⏳':'');label.addEventListener('click',()=>onSelect(d.id));overlay.append(label);labels.set(d.id,label)});dirty=true;}
 function view(){const a=Math.max(.1,host.clientWidth/Math.max(1,host.clientHeight)),h=32*Math.max(1,.8/a);camera.left=-h*a;camera.right=h*a;camera.top=h;camera.bottom=-h;camera.zoom=zoom;camera.position.set(target.x+Math.sin(angle)*65,68,target.z+Math.cos(angle)*65);camera.lookAt(target);camera.updateProjectionMatrix();dirty=true;}
 function resize(){if(host.clientWidth&&host.clientHeight){renderer.setSize(host.clientWidth,host.clientHeight,false);view()}}const observer=new ResizeObserver(resize);observer.observe(host);resize();
 const points=new Map();let start=null,moved=false;const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));function metric(){const p=[...points.values()];return p.length>1?{x:(p[0].x+p[1].x)/2,y:(p[0].y+p[1].y)/2,d:Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y)}:{...p[0],d:0}}
 function begin(){start={...metric(),zoom,tx:target.x,tz:target.z}}
 canvas.addEventListener('pointerdown',e=>{if(e.button!==0&&e.pointerType==='mouse')return;canvas.setPointerCapture(e.pointerId);points.set(e.pointerId,{x:e.clientX,y:e.clientY});if(points.size===1)moved=false;else moved=true;begin()});
 canvas.addEventListener('pointermove',e=>{if(!points.has(e.pointerId))return;points.set(e.pointerId,{x:e.clientX,y:e.clientY});const m=metric(),dx=m.x-start.x,dy=m.y-start.y;if(!moved&&Math.hypot(dx,dy)<6)return;moved=true;if(points.size>1&&start.d>0)zoom=clamp(start.zoom*m.d/start.d,.7,3.5);else{const k=64/Math.max(1,host.clientHeight)/zoom;target.x=clamp(start.tx+(-dx*Math.cos(angle)-dy*Math.sin(angle))*k,-35,35);target.z=clamp(start.tz+(dx*Math.sin(angle)-dy*Math.cos(angle))*k,-35,35)}view()});
 function finish(e){if(!points.has(e.pointerId))return;points.delete(e.pointerId);if(points.size){begin();return}if(!moved&&e.type==='pointerup'){const r=canvas.getBoundingClientRect(),ray=new T.Raycaster();ray.setFromCamera(new T.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1),camera);const hit=ray.intersectObjects([...buildings.values()],true)[0];if(hit){let obj=hit.object;while(obj&&!obj.userData.id)obj=obj.parent;if(obj)onSelect(obj.userData.id)}}}
 for(const name of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(name,finish);
 canvas.addEventListener('wheel',e=>{e.preventDefault();zoom=clamp(zoom*Math.exp(-e.deltaY*.001),.7,3.5);view()},{passive:false});
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();onFailure('3D graphics context lost')});
 const vec=new T.Vector3();const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 function draw(t){if(disposed)return;frame=requestAnimationFrame(draw);if(document.hidden)return;if(!host.isConnected){dispose();return}if(!reduced){for(const {g,x,z,i} of movers){g.position.set(x,0,z+Math.sin(t*.00035+i)*8);g.rotation.y=Math.cos(t*.00035+i)>0?0:Math.PI}dirty=true}if(!dirty)return;dirty=false;renderer.render(scene,camera);for(const d of active){const b=buildings.get(d.id),el=labels.get(d.id);vec.set(b.position.x,.5,b.position.z+3.8).project(camera);el.style.left=((vec.x+1)*50)+'%';el.style.top=((1-vec.y)*50)+'%';el.hidden=Math.abs(vec.x)>1||Math.abs(vec.y)>1}}
 function dispose(){if(disposed)return;disposed=true;cancelAnimationFrame(frame);observer.disconnect();for(const g of geos.values())g.dispose();for(const m of mats.values())m.dispose();renderer.dispose();canvas.remove();overlay.remove()}
 frame=requestAnimationFrame(draw);
 return {update,dispose,zoom(d){zoom=clamp(zoom*d,.7,3.5);view()},rotate(){angle+=Math.PI/2;view()},reset(){zoom=1;target.set(0,0,0);angle=Math.PI/5;view()}};
}
