// SOS sent confirmation illustration
// Flat vector art: checkmark, signal waves, location pin
// Spec: EPIMOYO_REDESIGN.md §5.3 (Illustrations)

import { View } from "react-native"
import Svg, { Circle, Path, G, Line, Polyline } from "react-native-svg"
import { colors } from "../../lib/theme"

interface SOSSentIllustrationProps {
  width?: number
  height?: number
}

export function SOSSentIllustration({
  width = 200,
  height = 200,
}: SOSSentIllustrationProps) {
  return (
    <View style={{ width, height, alignItems: "center", justifyContent: "center" }}>
      <Svg width={width} height={height} viewBox="0 0 200 200" fill="none">
        {/* Outer success ring */}
        <Circle cx={100} cy={100} r={85} stroke={colors.success} strokeWidth={2} opacity={0.3} fill="none" />

        {/* Background circle */}
        <Circle cx={100} cy={100} r={70} fill={colors.successSoft} opacity={0.2} />

        {/* Checkmark circle */}
        <Circle cx={100} cy={100} r={55} fill={colors.success} opacity={0.1} stroke={colors.success} strokeWidth={2} />

        {/* Large checkmark */}
        <G>
          {/* Checkmark path */}
          <Path
            d="M 75 100 L 90 115 L 130 75"
            stroke={colors.success}
            strokeWidth={6}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </G>

        {/* Signal waves around checkmark */}
        <G>
          {/* Wave 1 - inner */}
          <Path
            d="M 60 85 Q 70 75 80 85"
            stroke={colors.primary}
            strokeWidth={2}
            fill="none"
            strokeLinecap="round"
            opacity={0.4}
          />
          {/* Wave 2 - outer */}
          <Path
            d="M 45 70 Q 60 55 75 70"
            stroke={colors.primary}
            strokeWidth={2}
            fill="none"
            strokeLinecap="round"
            opacity={0.3}
          />

          {/* Waves on right */}
          <Path
            d="M 140 85 Q 130 75 120 85"
            stroke={colors.primary}
            strokeWidth={2}
            fill="none"
            strokeLinecap="round"
            opacity={0.4}
          />
          <Path
            d="M 155 70 Q 140 55 125 70"
            stroke={colors.primary}
            strokeWidth={2}
            fill="none"
            strokeLinecap="round"
            opacity={0.3}
          />
        </G>

        {/* Location pin at bottom */}
        <G>
          {/* Pin body */}
          <Path
            d="M 100 125 C 100 125 85 140 85 150 C 85 160 92 168 100 168 C 108 168 115 160 115 150 C 115 140 100 125 100 125"
            fill={colors.danger}
            opacity={0.8}
          />
          {/* Pin dot */}
          <Circle cx={100} cy={150} r={5} fill="#FFFFFF" />
        </G>

        {/* Subtle pulses (for animation reference) */}
        <Circle cx={100} cy={100} r={70} stroke={colors.success} strokeWidth={1} opacity={0.1} fill="none" />
      </Svg>
    </View>
  )
}
