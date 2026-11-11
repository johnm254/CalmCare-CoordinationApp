import { View, Animated, StyleSheet } from "react-native"
import { useEffect, useRef } from "react"
import { colors, radius, spacing } from "../lib/theme"

export interface SkeletonProps {
  width?: string | number
  height?: number
  borderRadius?: number
  style?: any
}

export function Skeleton({
  width = "100%",
  height = 16,
  borderRadius = radius.md,
  style,
}: SkeletonProps) {
  const opacityAnim = useRef(new Animated.Value(0.3)).current

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacityAnim, {
          toValue: 0.8,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    )
    loop.start()
    return () => loop.stop()
  }, [])

  return (
    <Animated.View
      style={[
        s.skeleton,
        {
          width,
          height,
          borderRadius,
          opacity: opacityAnim,
        },
        style,
      ]}
    />
  )
}

const s = StyleSheet.create({
  skeleton: {
    backgroundColor: colors.border,
  },
})
