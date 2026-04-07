import { useMemo } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { Platform, StyleSheet, View } from 'react-native';
import Svg, { Path, Text as SvgText } from 'react-native-svg';
import { theme } from '../../presentation/theme/theme';
import { type ThemeColors, useThemeColors } from '../../presentation/theme/ThemeContext';

const SCALLOP_LOBES = 8;
const SCALLOP_POINTS = 96;

function scallopedPathD(
  cx: number,
  cy: number,
  r0: number,
  amp: number,
  lobes: number,
  nPoints: number,
): string {
  const pts: number[] = [];
  for (let i = 0; i < nPoints; i++) {
    const t = (i / nPoints) * Math.PI * 2;
    const r = r0 + amp * Math.cos(lobes * t);
    pts.push(cx + r * Math.cos(t), cy + r * Math.sin(t));
  }
  let d = `M ${pts[0].toFixed(2)} ${pts[1].toFixed(2)}`;
  for (let i = 2; i < pts.length; i += 2) {
    d += ` L ${pts[i].toFixed(2)} ${pts[i + 1].toFixed(2)}`;
  }
  d += ' Z';
  return d;
}

type LevelBadgeProps = {
  level: number;
  tier: string;
  tierColorHint?: string | null;
  compact?: boolean;
  lineFontSize?: number;
  style?: StyleProp<ViewStyle>;
};

type CoinPalette = {
  fill: string;
  rim: string;
  numFill?: string;
  /** API `tier_color_hint` — digits use on-brand (usually white). */
  usesServerTierTint?: boolean;
};

export type LevelBadgeMetalElement = {
  metal: string;
  element: string;
};

export function getLevelBadgeMetalElement(level: number): LevelBadgeMetalElement {
  const L = Math.max(1, Math.floor(level));
  if (L <= 10) return { metal: 'Bronze', element: 'Earth' };
  if (L <= 25) return { metal: 'Silver', element: 'Water' };
  if (L <= 50) return { metal: 'Gold', element: 'Fire' };
  if (L <= 100) return { metal: 'Platinum', element: 'Air' };
  return { metal: 'Aether', element: 'Spirit' };
}

export function getLevelBadgeThemeLabel(level: number): string {
  const { metal, element } = getLevelBadgeMetalElement(level);
  return `${metal} · ${element}`;
}

/** `#RGB` / `#RRGGBB` from API `tier_color_hint` — drives rim/fill when present. */
function parseTierHex(hint: string | null | undefined): string | null {
  const s = hint?.trim();
  if (!s || !s.startsWith('#')) return null;
  const hex = s.slice(1);
  if (/^[0-9a-fA-F]{6}$/.test(hex)) return `#${hex.toLowerCase()}`;
  if (/^[0-9a-fA-F]{3}$/.test(hex)) {
    const a = hex[0] + hex[0];
    const b = hex[1] + hex[1];
    const c = hex[2] + hex[2];
    return `#${a}${b}${c}`.toLowerCase();
  }
  return null;
}

function coinPaletteFromLevel(level: number, tierColorHint?: string | null): CoinPalette {
  const hint = parseTierHex(tierColorHint);
  if (hint) {
    return { fill: hint, rim: hint, usesServerTierTint: true };
  }
  const L = Math.max(1, Math.floor(level));
  if (L <= 10) {
    return { fill: '#C9955C', rim: '#4A2E1A', numFill: '#1C1917' };
  }
  if (L <= 25) {
    return { fill: '#AEBDD4', rim: '#1A2F4A', numFill: '#0F172A' };
  }
  if (L <= 50) {
    return { fill: '#F4B41A', rim: '#7A450A', numFill: '#422006' };
  }
  if (L <= 100) {
    return { fill: '#F1F5F9', rim: '#475569' };
  }
  return { fill: '#8B5CF6', rim: '#3B0764' };
}

function digitFillForLevel(level: number, coin: CoinPalette, colors: ThemeColors): string {
  if (coin.usesServerTierTint) return colors.onBrand;
  const L = Math.max(1, Math.floor(level));
  if (L >= 51 && L <= 100) return colors.textPrimary;
  if (L > 100) return colors.onBrand;
  return coin.numFill ?? colors.textPrimary;
}

const SIZE = { compact: 36, default: 44 } as const;

/** Slightly larger than label cap height so the coin reads clearly next to names. */
function sizeFromLineFont(lineFontSize: number): number {
  const n = Math.round(lineFontSize * 1.38);
  return Math.min(31, Math.max(16, n));
}

function digitFontSizeForBadge(size: number, digitLen: number): number {
  const ratio = digitLen >= 3 ? 0.33 : digitLen === 2 ? 0.39 : 0.46;
  return Math.max(7, Math.round(size * ratio));
}

const SCALLOP_AMP_RATIO = 0.065;

function geometryForSize(size: number, strokeW: number) {
  const cx = size / 2;
  const cy = size / 2;
  const margin = Math.max(strokeW * 0.5 + 2.25, size * 0.1);
  const maxR = size / 2 - margin;
  const amp = maxR * SCALLOP_AMP_RATIO;
  const r0 = maxR - amp;
  return { cx, cy, r0, amp, maxR };
}

export function LevelBadge({
  level,
  tier,
  tierColorHint,
  compact,
  lineFontSize,
  style,
}: LevelBadgeProps) {
  const colors = useThemeColors();
  const coin = useMemo(() => coinPaletteFromLevel(level, tierColorHint), [level, tierColorHint]);
  const digitFill = useMemo(() => digitFillForLevel(level, coin, colors), [level, coin, colors]);
  const themeLabel = useMemo(() => getLevelBadgeThemeLabel(level), [level]);
  const lineFont =
    lineFontSize != null && Number.isFinite(lineFontSize) && lineFontSize > 0
      ? lineFontSize
      : null;
  const inline = lineFont != null;
  const size = lineFont != null ? sizeFromLineFont(lineFont) : compact ? SIZE.compact : SIZE.default;
  const displayLevel = Math.max(1, Math.floor(level));
  const digitLen = String(displayLevel).length;

  const fontFamily = theme.typography.extraBold;
  const strokeW = inline ? (size <= 18 ? 1 : 1.4) : compact ? 1.5 : 2;

  const { cx, cy, r0, amp } = geometryForSize(size, strokeW);

  const facePath = useMemo(
    () => scallopedPathD(cx, cy, r0, amp, SCALLOP_LOBES, SCALLOP_POINTS),
    [cx, cy, r0, amp],
  );

  const fontSize = useMemo(() => digitFontSizeForBadge(size, digitLen), [size, digitLen]);

  const shadowColor =
    colors.surface === '#121214' ? 'rgba(0,0,0,0.45)' : 'rgba(15,23,42,0.18)';

  return (
    <View
      style={[
        styles.outer,
        {
          width: size,
          height: size,
          shadowColor,
          marginLeft: inline ? 4 : compact ? 6 : 8,
        },
        style,
      ]}
      accessibilityRole="image"
      accessibilityLabel={`Level ${level}, ${themeLabel}, ${tier}`}
    >
      <Svg width={size} height={size}>
        <Path
          d={facePath}
          fill={coin.fill}
          stroke={coin.rim}
          strokeWidth={strokeW}
          strokeLinejoin="round"
        />
        <SvgText
          x={cx}
          y={cy + fontSize * 0.34}
          fontSize={fontSize}
          fontWeight="800"
          fill={digitFill}
          textAnchor="middle"
          fontFamily={fontFamily}
        >
          {String(displayLevel)}
        </SvgText>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 1,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
      default: {
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.88,
        shadowRadius: 5,
      },
    }),
  },
});
