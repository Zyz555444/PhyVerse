export function Lighting() {
  return (
    <>
      <ambientLight intensity={0.4} />
      <hemisphereLight intensity={0.3} groundColor="#f0f0ea" color="#ffffff" />
      <directionalLight
        position={[10, 12, 8]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={0.5}
        shadow-camera-far={50}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
        shadow-bias={-0.0001}
        shadow-normalBias={0.02}
      />
      <directionalLight position={[-8, 6, -4]} intensity={0.3} color="#a0c4d4" />
    </>
  )
}
