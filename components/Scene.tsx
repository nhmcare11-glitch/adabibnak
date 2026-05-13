'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls, useGLTF, Bounds, Environment, ContactShadows } from '@react-three/drei'
import { Suspense } from 'react'

function StethoscopeModel() {
  const { scene } = useGLTF('/doctor.glb')
  
  return (
    <Bounds fit clip observe margin={1.2}>
      <primitive object={scene} />
    </Bounds>
  )
}

export default function Scene() {
  return (
    <Canvas
      camera={{ position: [0, 1, 5], fov: 45 }}
      style={{ 
        width: '100%', 
        height: '100%',
        pointerEvents: 'none'
      }}
    >
      <Suspense fallback={null}>
        {/* Step 3: Environment map - this brings back colors! */}
        <Environment preset="city" background={false} /> 
        
        {/* Step 4: Soft shadows for depth */}
        <ContactShadows 
          position={[0, -1.5, 0]} 
          opacity={0.4} 
          scale={5} 
          blur={2} 
          far={2}
        />
        
        {/* Step 5: Basic lighting to support the environment */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} />
        
        <StethoscopeModel />
        
        <OrbitControls 
          enableZoom={false}
          enablePan={false}
          autoRotate={true}
          autoRotateSpeed={1.5}
        />
      </Suspense>
    </Canvas>
  )
}