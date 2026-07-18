export function Lighting() {
  return (
    <>
      <ambientLight intensity={0.35} />
      <hemisphereLight intensity={0.45} groundColor="#e5e5de" color="#ffffff" />
      <directionalLight
        position={[8, 14, 10]}
        intensity={1.6}
        castShadow
        shadow-mapSize={[4096, 4096]}
        shadow-camera-near={0.5}
        shadow-camera-far={60}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
        shadow-bias={-0.00005}
        shadow-normalBias={0.02}
      />
      {/* Cool fill from the left */}
      <directionalLight position={[-10, 8, -6]} intensity={0.45} color="#cfe8f7" />
      {/* Warm rim from behind */}
      <directionalLight position={[0, 6, -12]} intensity={0.25} color="#fff3d6" />
    </>
  )
}
