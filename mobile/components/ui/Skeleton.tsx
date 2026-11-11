import { useEffect, useRef } from "react"
import { Animated, StyleSheet, ViewStyle } from "react-native"
import { colors, radius } from "../../lib/theme"

type SkeletonProps = {
  width: number | string
  height: number
  style?: ViewStyle
}

export default function Skeleton({ width, height, style }: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.4)).current

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 1000, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 1000, useNativeDriver: true }),
      ]),
    )
    anim.start()
    return () => anim.stop()
  }, [])

  return (
    <Animated.View
      style={[
        styles.bone,
        { width: width as number, height, opacity },
        style,
      ]}
    />
  )
}

const styles = StyleSheet.create({
  bone: {
    backgroundColor: colors.border,
    borderRadius: radius.md,
  },
})
