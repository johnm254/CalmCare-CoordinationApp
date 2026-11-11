// Welcome illustration for onboarding
// Flat vector art: hand holding heart, heartbeat line, care circle
// Spec: EPIMOYO_REDESIGN.md §5.3 (Illustrations)

import { View, StyleSheet } from "react-native"
import Svg, { Circle, Path, G, Rect, Line, Polyline } from "react-native-svg"
import { colors } from "../../lib/theme"

interface WelcomeIllustrationProps {
  width?: number
  height?: number
}

export function WelcomeIllustration({
  width = 240,
  height = 240,
}: WelcomeIllustrationProps) {
  return (
    <View style={{ width, height, alignItems: "center", justifyContent: "center" }}>
      <Svg width={width} height={height} viewBox="0 0 240 240" fill="none">
        {/* Background circle */}
        <Circle cx={120} cy={120} r={110} fill={colors.primarySoft} opacity={0.3} />

        {/* Heartbeat line */}
        <Polyline
          points="50,140 70,140 80,120 90,160 100,140 110,140 130,100 150,160 160,130 170,140 190,140"
          stroke={colors.primary}
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />

        {/* Hand holding */}
        <G>
          {/* Palm */}
          <Rect
            x={80}
            y={80}
            width={50}
            height={40}
            rx={8}
            fill={colors.textOnLight}
            opacity={0.8}
          />
          {/* Thumb */}
          <Circle cx={75} cy={85} r={6} fill={colors.textOnLight} opacity={0.8} />
          {/* Fingers */}
          <Line x1={85} y1={75} x2={85} y2={60} stroke={colors.textOnLight} strokeWidth={4} strokeLinecap="round" opacity={0.8} />
          <Line x1={100} y1={72} x2={100} y2={55} stroke={colors.textOnLight} strokeWidth={4} strokeLinecap="round" opacity={0.8} />
          <Line x1={115} y1={75} x2={115} y2={60} stroke={colors.textOnLight} strokeWidth={4} strokeLinecap="round" opacity={0.8} />
          <Line x1={130} y1={80} x2={130} y2={65} stroke={colors.textOnLight} strokeWidth={4} strokeLinecap="round" opacity={0.8} />
        </G>

        {/* Heart in hand */}
        <G>
          {/* Heart shape */}
          <Path
            d="M 115 95 C 115 95 120 85 125 85 C 130 85 132 92 130 98 C 128 92 125 95 115 105 C 105 95 102 92 100 98 C 98 92 100 85 105 85 C 110 85 115 95 115 95"
            fill={colors.danger}
          />
        </G>

        {/* Care circle dots around */}
        <Circle cx={60} cy={60} r={8} fill={colors.primary} opacity={0.6} />
        <Circle cx={180} cy={60} r={8} fill={colors.primary} opacity={0.6} />
        <Circle cx={60} cy={180} r={8} fill={colors.primary} opacity={0.6} />
        <Circle cx={180} cy={180} r={8} fill={colors.primary} opacity={0.6} />

        {/* Connecting lines (subtle) */}
        <Line
          x1={68}
          y1={68}
          x2={110}
          y2={110}
          stroke={colors.primary}
          strokeWidth={1}
          opacity={0.2}
        />
        <Line
          x1={172}
          y1={68}
          x2={130}
          y2={110}
          stroke={colors.primary}
          strokeWidth={1}
          opacity={0.2}
        />
        <Line
          x1={68}
          y1={172}
          x2={110}
          y2={130}
          stroke={colors.primary}
          strokeWidth={1}
          opacity={0.2}
        />
        <Line
          x1={172}
          y1={172}
          x2={130}
          y2={130}
          stroke={colors.primary}
          strokeWidth={1}
          opacity={0.2}
        />
      </Svg>
    </View>
  )
}
