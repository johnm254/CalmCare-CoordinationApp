// Strap pairing illustration
// Flat vector art: smartwatch/band with Bluetooth symbol
// Spec: EPIMOYO_REDESIGN.md §5.3 (Illustrations)

import { View } from "react-native"
import Svg, { Circle, Path, G, Rect, Line } from "react-native-svg"
import { colors } from "../../lib/theme"

interface StrapPairingIllustrationProps {
  width?: number
  height?: number
  state?: "searching" | "pairing" | "success"
}

export function StrapPairingIllustration({
  width = 220,
  height = 220,
  state = "searching",
}: StrapPairingIllustrationProps) {
  return (
    <View style={{ width, height, alignItems: "center", justifyContent: "center" }}>
      <Svg width={width} height={height} viewBox="0 0 220 220" fill="none">
        {/* Background */}
        <Circle cx={110} cy={110} r={100} fill={colors.primarySoft} opacity={0.15} />

        {/* Smartwatch band */}
        <G>
          {/* Band body */}
          <Rect x={60} y={50} width={100} height={120} rx={16} stroke={colors.text} strokeWidth={2.5} fill={colors.surface} />
          
          {/* Watch screen */}
          <Rect x={70} y={65} width={80} height={70} rx={8} fill={colors.bg} stroke={colors.border} strokeWidth={1.5} />
          
          {/* Heart rate display */}
          <Circle cx={95} cy={90} r={6} fill={colors.danger} opacity={0.7} />
          <Line x1={105} y1={90} x2={115} y2={85} stroke={colors.text} strokeWidth={1.5} strokeLinecap="round" opacity={0.5} />
          <Line x1={115} y1={85} x2={125} y2={95} stroke={colors.text} strokeWidth={1.5} strokeLinecap="round" opacity={0.5} />
          
          {/* Status text on band */}
          <Path d="M 85 115 L 88 115 L 90 118 L 88 118 L 85 118" fill={colors.textMuted} opacity={0.6} />
          <Path d="M 98 115 L 105 115 L 105 118 L 98 118" fill={colors.textMuted} opacity={0.6} />
          <Path d="M 113 115 L 120 115 L 120 118 L 113 118" fill={colors.textMuted} opacity={0.6} />
          
          {/* Band straps */}
          <Rect x={65} y={40} width={20} height={12} rx={3} fill={colors.text} opacity={0.3} />
          <Rect x={135} y={40} width={20} height={12} rx={3} fill={colors.text} opacity={0.3} />
          <Rect x={65} y={168} width={20} height={12} rx={3} fill={colors.text} opacity={0.3} />
          <Rect x={135} y={168} width={20} height={12} rx={3} fill={colors.text} opacity={0.3} />
        </G>

        {/* Bluetooth symbol */}
        <G>
          {/* Central dot */}
          <Circle cx={155} cy={145} r={3} fill={colors.primary} />
          
          {/* Bluetooth triangles */}
          <Path
            d="M 155 135 L 165 145 L 155 155 M 155 135 L 165 145 L 155 155"
            stroke={colors.primary}
            strokeWidth={2}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M 145 140 L 155 145 L 145 150"
            stroke={colors.primary}
            strokeWidth={2}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </G>

        {/* Status indicators */}
        {state === "searching" && (
          <G>
            {/* Searching waves */}
            <Circle cx={110} cy={110} r={30} stroke={colors.amber} strokeWidth={1.5} fill="none" opacity={0.5} />
            <Circle cx={110} cy={110} r={45} stroke={colors.amber} strokeWidth={1} fill="none" opacity={0.3} />
          </G>
        )}

        {state === "pairing" && (
          <G>
            {/* Pulse effect */}
            <Circle cx={110} cy={110} r={35} stroke={colors.primary} strokeWidth={2} fill="none" opacity={0.6} />
            <Circle cx={110} cy={110} r={50} stroke={colors.primary} strokeWidth={1.5} fill="none" opacity={0.3} />
          </G>
        )}

        {state === "success" && (
          <G>
            {/* Success checkmark */}
            <Circle cx={110} cy={110} r={48} fill={colors.success} opacity={0.1} stroke={colors.success} strokeWidth={2} />
            <Path
              d="M 95 115 L 105 125 L 130 100"
              stroke={colors.success}
              strokeWidth={3}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </G>
        )}
      </Svg>
    </View>
  )
}
