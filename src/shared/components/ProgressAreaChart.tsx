import { useMemo } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { theme } from '../../presentation/theme/theme';
import type { ThemeColors } from '../../presentation/theme/ThemeContext';

const CHART_HEIGHT = 152;
const PAD_L = 4;
const PAD_R = 4;
const PAD_T = 8;
const PAD_B = 28;

/** Deterministic mock series from seed (7 points = days). */
function seriesFromSeed(seed: string): number[] {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const out: number[] = [];
  for (let i = 0; i < 7; i++) {
    const x = Math.imul(h + i * 9973, 1103515245) >>> 0;
    out.push(4 + (x % 22));
  }
  return out;
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

type Props = {
  colors: ThemeColors;
  seed: string;
};

/**
 * Filled area chart (mock weekly trend) using progress palette only.
 */
export function ProgressAreaChart({ colors, seed }: Props) {
  const { width: windowW } = useWindowDimensions();
  const chartW = Math.max(280, windowW - theme.spacing.screenPaddingH * 2 - 32);
  const data = useMemo(() => seriesFromSeed(seed), [seed]);

  const styles = useMemo(() => createStyles(colors), [colors]);

  const { areaPath, linePath } = useMemo(() => {
    const hi = Math.max(...data, 1);
    const lo = 0;
    const innerW = chartW - PAD_L - PAD_R;
    const innerH = CHART_HEIGHT - PAD_T - PAD_B;
    const n = data.length;
    const step = innerW / Math.max(n - 1, 1);
    const yAt = (v: number) => PAD_T + innerH - ((v - lo) / (hi - lo)) * innerH;

    const pts = data.map((v, i) => ({
      x: PAD_L + i * step,
      y: yAt(v),
    }));

    const bottom = CHART_HEIGHT - PAD_B;
    const first = pts[0]!;
    const last = pts[pts.length - 1]!;
    let d = `M ${first.x} ${bottom} L ${first.x} ${first.y}`;
    for (let i = 1; i < pts.length; i++) {
      d += ` L ${pts[i]!.x} ${pts[i]!.y}`;
    }
    d += ` L ${last.x} ${bottom} Z`;

    let line = `M ${first.x} ${first.y}`;
    for (let i = 1; i < pts.length; i++) {
      line += ` L ${pts[i]!.x} ${pts[i]!.y}`;
    }

    return { areaPath: d, linePath: line };
  }, [data, chartW]);

  const gradientId = 'progressAreaFill';

  return (
    <View style={styles.wrap}>
      <Text style={styles.caption}>Weekly focus (mock)</Text>
      <Svg width={chartW} height={CHART_HEIGHT} accessibilityLabel="Weekly activity area chart">
        <Defs>
          <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.progress} stopOpacity="0.42" />
            <Stop offset="1" stopColor={colors.progressLight} stopOpacity="0.35" />
          </LinearGradient>
        </Defs>
        <Path d={areaPath} fill={`url(#${gradientId})`} />
        <Path
          d={linePath}
          fill="none"
          stroke={colors.progress}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
      <View style={styles.xAxis}>
        {DAY_LABELS.map((label) => (
          <Text key={label} style={styles.axisTick} numberOfLines={1}>
            {label}
          </Text>
        ))}
      </View>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrap: {
      marginTop: 4,
    },
    caption: {
      fontFamily: theme.typography.regular,
      fontSize: theme.fontSizes.meta,
      color: colors.textMuted,
      marginBottom: 8,
    },
    xAxis: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 2,
      marginTop: 4,
    },
    axisTick: {
      flex: 1,
      fontFamily: theme.typography.regular,
      fontSize: theme.fontSizes.meta,
      color: colors.textMuted,
      textAlign: 'center',
    },
  });
}
