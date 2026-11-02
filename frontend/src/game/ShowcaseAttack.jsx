import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { buildVillage } from './villageBuilder';

const Packet = ({ from, to, color, offset, speed }) => {
  const mesh = useRef();
  useFrame(({ clock }) => {
    if (!mesh.current) return;
    const k = (clock.elapsedTime * speed + offset) % 1;
    mesh.current.position.set(
      from.x + (to.x - from.x) * k,
      from.y + (to.y - from.y) * k + Math.sin(k * Math.PI) * 2.2,
      from.z + (to.z - from.z) * k,
    );
  });
  return <mesh ref={mesh}>
    <boxGeometry args={[0.28, 0.28, 0.7]} />
    <meshBasicMaterial color={color} toneMapped={false} />
  </mesh>;
};

const Beam = ({ from, to, color }) => {
  const ref = useRef();
  useLayoutEffect(() => {
    const start = new THREE.Vector3(from.x, from.y, from.z);
    const end = new THREE.Vector3(to.x, to.y, to.z);
    const mid = start.clone().lerp(end, 0.5);
    ref.current.position.copy(mid);
    ref.current.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), end.clone().sub(start).normalize());
    ref.current.scale.set(0.035, start.distanceTo(end), 0.035);
  }, [from, to]);
  return <mesh ref={ref}>
    <boxGeometry />
    <meshBasicMaterial color={color} transparent opacity={0.28} toneMapped={false} />
  </mesh>;
};

export function ShowcaseAttack() {
  const city = useMemo(buildVillage, []);
  const routes = useMemo(() => {
    const base = city.buildings.find(b => b.role === 'base');
    const antennas = city.antennas || [];
    if (!base || !antennas.length) return [];
    const home = { x: base.x, y: (base.roof || 4) + 2.5, z: base.z };
    const step = Math.max(1, Math.floor(antennas.length / 3));
    return [0, step, step * 2].map(index => antennas[index]).filter(Boolean).map(node => ({
      from: home,
      to: { x: node.x, y: node.y, z: node.z },
    }));
  }, [city]);
  if (!routes.length) return null;
  return <group>
    {routes.map((route, index) => <group key={index}>
      <Beam from={route.from} to={route.to} color={index % 2 ? '#ff4fd8' : '#39e7ff'} />
      <Packet from={route.from} to={route.to} color="#7af6ff" offset={index * 0.2} speed={0.22} />
      <Packet from={route.to} to={route.from} color="#ff4fd8" offset={0.45 + index * 0.15} speed={0.22} />
    </group>)}
  </group>;
}
