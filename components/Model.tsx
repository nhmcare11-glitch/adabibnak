import { useGLTF, useAnimations } from '@react-three/drei'
import { useEffect, useRef } from 'react'
import { Group, Box3, Vector3 } from 'three'

useGLTF.preload("/doctor.glb")

export default function Model() {
  const group = useRef<Group>(null)
  const { scene, animations } = useGLTF("/doctor.glb")
  const { actions } = useAnimations(animations, scene)

  useEffect(() => {
    const box = new Box3().setFromObject(scene)
    const center = new Vector3()
    box.getCenter(center)

    // ✅ نمركز المجسم على نقطة الأصل (0,0,0) بدقة
    scene.position.set(-center.x, -center.y, -center.z)

    // ✅ نضبط الحجم باش يملأ الكانفاس بشكل مناسب
    const size = new Vector3()
    box.getSize(size)
    const maxDim = Math.max(size.x, size.y, size.z)
    const scale = 12 / maxDim   // ← زيد أو نقص هاد الرقم حسب حجم المجسم نتاعك
    scene.scale.setScalar(scale)

    // ✅ شغّل الأنيميشن إذا كان موجود
    const action = Object.values(actions)[0]
    if (action) action.play()
  }, [scene, actions])

  return (
    <group ref={group}>
      <primitive object={scene} />
    </group>
  )
}