import { useEffect, useMemo, useState } from 'react';
import '@react-three/fiber';
import { FlickerBatch, VoxelBatch } from './VoxelBatch';
import { buildVillage } from './villageBuilder';
import { Boat, Sign, Banner } from './Models';
import { Glows } from './Glows';

export const Island = ({lite=false, level=1, linkGate=0, showcase=false}) => {
  const village=useMemo(buildVillage,[]);
  const [pulse,setPulse]=useState(0);
  useEffect(()=>{
    if(!showcase)return undefined;
    const id=setInterval(()=>setPulse(n=>n+1),2400);
    return()=>clearInterval(id);
  },[showcase]);
  const steady=useMemo(()=>village.lights.filter(l=>!l.flicker),[village]);
  const blink=useMemo(()=>village.lights.filter(l=>l.flicker),[village]);
  const open=useMemo(()=>{
    const gated=village.gated||[];
    if(!showcase)return gated.filter(l=>l.gate===level);
    const max=gated.reduce((m,l)=>Math.max(m,l.gate),1);
    const gates=new Set([1+(pulse%max),1+((pulse+Math.ceil(max/2))%max)]);
    return gated.filter(l=>gates.has(l.gate));
  },[village,level,showcase,pulse]);
  const link=useMemo(()=>(village.antennas||[]).filter(a=>a.gate===linkGate),[village,linkGate]);
  const [px,pz]=village.plaza;
  return <group>
    <VoxelBatch blocks={village.blocks} lite={lite}/><VoxelBatch blocks={steady} emissive/><FlickerBatch blocks={blink}/>
    {open.length>0&&<VoxelBatch blocks={open} emissive/>}
    {link.length>0&&<VoxelBatch blocks={link} emissive/>}
    <Glows lamps={village.lamps} lights={!lite}/>
    <Sign position={[1.7,2.4,-.4]} text="ROBIN TOWER"/>
    <Sign position={[-2.5,1.02,-6.9]} text="ROBINHACKERS"/>
    <Banner position={[px,3.6,pz+1.8]} text="ROBINHACKERS"/>
    <Boat position={[11.1,.18,14.2]} rotation={[0,Math.PI/2,0]} scale={1.05}/>
    <Boat position={[14.3,.17,15.3]} rotation={[0,-.12,0]} scale={.8}/>
  </group>;
};
