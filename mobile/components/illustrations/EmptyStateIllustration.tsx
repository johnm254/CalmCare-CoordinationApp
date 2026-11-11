// Empty state illustrations for various screens
// Flat vector art: calendar, pill, chart, etc.
// Spec: EPIMOYO_REDESIGN.md §5.3 (Illustrations)

import { View } from "react-native"
import Svg, { Circle, Path, G, Rect, Line, Text } from "react-native-svg"
import { colors } from "../../lib/theme"

interface EmptyStateIllustrationProps {
  type: "appointments" | "medications" | "events" | "notes"
  width?: number
  height?: number
}

export function EmptyStateIllustration({
  type,
  width = 180,
  height = 180,
}: EmptyStateIllustrationProps) {
  return (
    <View style={{ width, height, alignItems: "center", justifyContent: "center" }}>
      <Svg width={width} height={height} viewBox="0 0 180 180" fill="none">
        {/* Background circle */}
        <Circle cx={90} cy={90} r={75} fill={colors.border} opacity={0.15} />

        {type === "appointments" && (
          <G>
            {/* Calendar */}
            <Rect x={50} y={40} width={80} height={80} rx={8} stroke={colors.textMuted} strokeWidth={2} fill="none" />
            {/* Calendar header */}
            <Rect x={50} y={40} width={80} height={20} rx={8} fill={colors.amber} opacity={0.2} />
            {/* Days grid */}
            <Line x1={50} y1={60} x2={130} y2={60} stroke={colors.textMuted} strokeWidth={1} opacity={0.3} />
            <Line x1={50} y1={75} x2={130} y2={75} stroke={colors.textMuted} strokeWidth={1} opacity={0.3} />
            {/* Day cells */}
            <Line x1={70} y1={60} x2={70} y2={120} stroke={colors.textMuted} strokeWidth={1} opacity={0.3} />
            <Line x1={90} y1={60} x2={90} y2={120} stroke={colors.textMuted} strokeWidth={1} opacity={0.3} />
            <Line x1={110} y1={60} x2={110} y2={120} stroke={colors.textMuted} strokeWidth={1} opacity={0.3} />
            {/* Question mark */}
            <Text x={90} y={135} fontSize={24} fill={colors.textMuted} textAnchor="middle" opacity={0.5}>
              ?
            </Text>
          </G>
        )}

        {type === "medications" && (
          <G>
            {/* Pill bottle */}
            <Rect x={65} y={35} width={50} height={70} rx={6} stroke={colors.primary} strokeWidth={2.5} fill="none" />
            {/* Bottle cap */}
            <Rect x={70} y={30} width={40} height={8} rx={2} fill={colors.primary} />
            {/* Pills inside */}
            <Circle cx={75} cy={55} r={4} fill={colors.danger} opacity={0.6} />
            <Circle cx={90} cy={60} r={4} fill={colors.success} opacity={0.6} />
            <Circle cx={105} cy={55} r={4} fill={colors.primary} opacity={0.6} />
            {/* X over bottle */}
            <Line x1={50} y1={100} x2={130} y2={130} stroke={colors.textMuted} strokeWidth={2.5} opacity={0.4} strokeLinecap="round" />
            <Line x1={130} y1={100} x2={50} y2={130} stroke={colors.textMuted} strokeWidth={2.5} opacity={0.4} strokeLinecap="round" />
          </G>
        )}

        {type === "events" && (
          <G>
            {/* Chart bars */}
            <Rect x={50} y={95} width={15} height={35} rx={2} fill={colors.textMuted} opacity={0.4} />
            <Rect x={72} y={75} width={15} height={55} rx={2} fill={colors.textMuted} opacity={0.5} />
            <Rect x={94} y={85} width={15} height={45} rx={2} fill={colors.textMuted} opacity={0.4} />
            <Rect x={116} y={65} width={15} height={65} rx={2} fill={colors.textMuted} opacity={0.5} />
            {/* Baseline */}
            <Line x1={45} y1={130} x2={135} y2={130} stroke={colors.textMuted} strokeWidth={2} opacity={0.3} />
            {/* Empty marker */}
            <Circle cx={90} cy={50} r={20} stroke={colors.textMuted} strokeWidth={2} fill="none" opacity={0.5} />
            <Text x={90} y={57} fontSize={28} fill={colors.textMuted} textAnchor="middle" opacity={0.5}>
              0
            </Text>
          </G>
        )}

        {type === "notes" && (
          <G>
            {/* Notepad */}
            <Rect x={55} y={35} width={70} height={90} rx={6} stroke={colors.primary} strokeWidth={2} fill={colors.primarySoft} opacity={0.2} />
            {/* Lines */}
            <Line x1={65} y1={50} x2={115} y2={50} stroke={colors.textMuted} strokeWidth={1.5} opacity={0.3} />
            <Line x1={65} y1={62} x2={115} y2={62} stroke={colors.textMuted} strokeWidth={1.5} opacity={0.3} />
            <Line x1={65} y1={74} x2={115} y2={74} stroke={colors.textMuted} strokeWidth={1.5} opacity={0.3} />
            <Line x1={65} y1={86} x2={100} y2={86} stroke={colors.textMuted} strokeWidth={1.5} opacity={0.3} />
            {/* Pencil */}
            <Path
              d="M 125 35 L 135 25 C 137 23 140 23 142 25 L 152 35"
              stroke={colors.primary}
              strokeWidth={2}
              fill="none"
              strokeLinecap="round"
            />
          </G>
        )}
      </Svg>
    </View>
  )
}
