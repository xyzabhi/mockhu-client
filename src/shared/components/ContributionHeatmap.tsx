import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { theme } from '../../presentation/theme/theme';
import type { ThemeColors } from '../../presentation/theme/ThemeContext';

const WEEKS = 20;
const ROWS = 7;
const CELL = 11;
const GAP = 3;

function cellLevel(weekIndex: number, dayIndex: number, seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const n = weekIndex * ROWS + dayIndex + h;
  const x = Math.imul(n ^ (n >>> 16), 2246822519) >>> 0;
  return x % 5;
}

function levelBackground(level: number, colors: ThemeColors): string {
  switch (level) {
    case 0:
      return colors.surfaceSubtle;
    case 1:
      return colors.progressLight;
    case 2:
      return colors.progressBorder;
    case 3:
    case 4:
      return colors.progress;
    default:
      return colors.surfaceSubtle;
  }
}

type Props = {
  colors: ThemeColors;
  /** Varies mock intensities when tab / exam filter changes */
  seed: string;
};

/**
 * GitHub-style contribution grid: columns = weeks (oldest → newest), rows = Sun–Sat.
 */
export function ContributionHeatmap({ colors, seed }: Props) {
  const styles = useMemo(() => createStyles(colors), [colors]);

  const columns = useMemo(() => {
    const cols: number[][] = [];
    for (let w = 0; w < WEEKS; w++) {
      const days: number[] = [];
      for (let d = 0; d < ROWS; d++) {
        days.push(cellLevel(w, d, seed));
      }
      cols.push(days);
    }
    return cols;
  }, [seed]);

  return (
    <View>
      <Text style={styles.caption}>Last {WEEKS} weeks · mock activity</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollInner}
        accessibilityLabel={`Activity heatmap, last ${WEEKS} weeks`}
      >
        <View style={styles.grid}>
          {columns.map((days, wi) => (
            <View key={wi} style={styles.col}>
              {days.map((level, di) => (
                <View
                  key={di}
                  style={[
                    styles.cell,
                    level >= 3 && { opacity: level === 3 ? 0.62 : 1 },
                    {
                      backgroundColor: levelBackground(level, colors),
                      borderWidth: level === 0 ? StyleSheet.hairlineWidth : 0,
                      borderColor: colors.borderSubtle,
                    },
                  ]}
                />
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
      <View style={styles.legendRow}>
        <Text style={styles.legendLabel}>Less</Text>
        {[0, 1, 2, 3, 4].map((lv) => (
          <View
            key={lv}
            style={[
              styles.legendSwatch,
              lv >= 3 && { opacity: lv === 3 ? 0.62 : 1 },
              {
                backgroundColor: levelBackground(lv, colors),
                borderWidth: lv === 0 ? StyleSheet.hairlineWidth : 0,
                borderColor: colors.borderSubtle,
              },
            ]}
          />
        ))}
        <Text style={styles.legendLabel}>More</Text>
      </View>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    caption: {
      fontFamily: theme.typography.regular,
      fontSize: theme.fontSizes.meta,
      color: colors.textMuted,
      marginBottom: 10,
    },
    scrollInner: {
      paddingBottom: 4,
    },
    grid: {
      flexDirection: 'row',
      gap: GAP,
    },
    col: {
      flexDirection: 'column',
      gap: GAP,
    },
    cell: {
      width: CELL,
      height: CELL,
      borderRadius: 2,
    },
    legendRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 12,
    },
    legendLabel: {
      fontFamily: theme.typography.regular,
      fontSize: theme.fontSizes.meta,
      color: colors.textMuted,
      marginRight: 4,
    },
    legendSwatch: {
      width: 10,
      height: 10,
      borderRadius: 2,
    },
  });
}
