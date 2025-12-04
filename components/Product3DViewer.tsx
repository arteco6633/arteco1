'use client'

import { Suspense, useRef, useState, useEffect } from 'react'
import { Canvas, useLoader, useFrame } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, Environment } from '@react-three/drei'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js'
import * as THREE from 'three'

interface Product3DViewerProps {
  modelUrl: string
  mtlUrl?: string
  autoRotate?: boolean
  className?: string
}

function Model({ url, mtlUrl }: { url: string; mtlUrl?: string }) {
  const meshRef = useRef<THREE.Group>(null)
  const [model, setModel] = useState<THREE.Group | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    
    // Загрузка материалов, если есть MTL файл
    if (mtlUrl) {
      const mtlLoader = new MTLLoader()
      mtlLoader.load(mtlUrl, (materials) => {
        materials.preload()
        
        // Загрузка модели с материалами
        const objLoader = new OBJLoader()
        objLoader.setMaterials(materials)
        objLoader.load(url, (object) => {
          setModel(object)
          setLoading(false)
        }, undefined, (error) => {
          console.error('Error loading OBJ with MTL:', error)
          setLoading(false)
        })
      }, undefined, (error) => {
        console.error('Error loading MTL:', error)
        // Загружаем только OBJ, если MTL не загрузился
        const objLoader = new OBJLoader()
        objLoader.load(url, (object) => {
          setModel(object)
          setLoading(false)
        })
      })
    } else {
      // Загрузка только OBJ файла
      const objLoader = new OBJLoader()
      objLoader.load(url, (object) => {
        setModel(object)
        setLoading(false)
      }, undefined, (error) => {
        console.error('Error loading OBJ:', error)
        setLoading(false)
      })
    }
  }, [url, mtlUrl])

  if (loading) {
    return null
  }

  if (!model) {
    return null
  }

  // Центрируем модель
  const box = new THREE.Box3().setFromObject(model)
  const center = box.getCenter(new THREE.Vector3())
  const size = box.getSize(new THREE.Vector3())
  const maxDim = Math.max(size.x, size.y, size.z)
  const scale = 1.5 / maxDim

  model.position.x = -center.x * scale
  model.position.y = -center.y * scale
  model.position.z = -center.z * scale
  model.scale.set(scale, scale, scale)

  return (
    <primitive 
      ref={meshRef}
      object={model} 
    />
  )
}

function Scene({ modelUrl, mtlUrl, autoRotate }: { modelUrl: string; mtlUrl?: string; autoRotate?: boolean }) {
  const controlsRef = useRef<any>(null)

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 5]} />
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <directionalLight position={[-10, -10, -5]} intensity={0.5} />
      <Environment preset="city" />
      <Suspense fallback={null}>
        <Model url={modelUrl} mtlUrl={mtlUrl} />
      </Suspense>
      <OrbitControls
        ref={controlsRef}
        enableZoom={true}
        enablePan={false}
        enableRotate={true}
        autoRotate={autoRotate}
        autoRotateSpeed={2}
        minDistance={2}
        maxDistance={10}
        minPolarAngle={0}
        maxPolarAngle={Math.PI}
      />
    </>
  )
}

export default function Product3DViewer({ 
  modelUrl, 
  mtlUrl, 
  autoRotate = false,
  className = '' 
}: Product3DViewerProps) {
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Проверяем доступность файла
    fetch(modelUrl, { method: 'HEAD' })
      .then(() => setError(false))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [modelUrl])

  if (loading) {
    return (
      <div className={`w-full h-full flex items-center justify-center bg-gray-100 ${className}`}>
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-2 border-black/20 border-t-black rounded-full animate-spin" />
          <span className="text-sm text-gray-600">Загрузка 3D модели...</span>
        </div>
      </div>
    )
  }

  if (error || !modelUrl) {
    return (
      <div className={`w-full h-full flex items-center justify-center bg-gray-100 ${className}`}>
        <span className="text-sm text-gray-400">3D модель недоступна</span>
      </div>
    )
  }

  return (
    <div className={`w-full h-full bg-gray-100 ${className}`}>
      <Canvas
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
        style={{ width: '100%', height: '100%' }}
      >
        <Scene modelUrl={modelUrl} mtlUrl={mtlUrl} autoRotate={autoRotate} />
      </Canvas>
    </div>
  )
}

