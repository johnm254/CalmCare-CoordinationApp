import { useEffect, useRef } from "react"
import {
  Animated,
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native"
import { colors, radius, fonts, spacing } from "../../lib/theme"

const { height: SCREEN_H } = Dimensions.get("window")
const SHEET_MAX = SCREEN_H * 0.85

type SheetProps = {
  visible: boolean
  onClose: () => void
  children: React.ReactNode
  title?: string
}

export default function Sheet({ visible, onClose, children, title }: SheetProps) {
  const translateY = useRef(new Animated.Value(SHEET_MAX)).current

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 70,
        friction: 13,
      }).start()
    } else {
      Animated.timing(translateY, {
        toValue: SHEET_MAX,
        duration: 260,
        useNativeDriver: true,
      }).start()
    }
  }, [visible])

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
      <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
        <View style={styles.handle} />
        {title ? (
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <View style={styles.closeX1} />
              <View style={styles.closeX2} />
            </TouchableOpacity>
          </View>
        ) : null}
        {children}
      </Animated.View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: SHEET_MAX,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.xl,
    paddingBottom: 48,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: "center",
    marginVertical: 14,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.xl,
  },
  title: { fontSize: fonts.lg, fontWeight: "800", color: colors.text },
  closeBtn: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  closeX1: {
    position: "absolute",
    width: 18,
    height: 2,
    backgroundColor: colors.textMuted,
    borderRadius: 1,
    transform: [{ rotate: "45deg" }],
  },
  closeX2: {
    position: "absolute",
    width: 18,
    height: 2,
    backgroundColor: colors.textMuted,
    borderRadius: 1,
    transform: [{ rotate: "-45deg" }],
  },
})
