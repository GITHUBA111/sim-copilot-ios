import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CockpitTheme } from '../theme/cockpitTheme';
import { CockpitHaptics } from '../utils/haptics';
import { TruckIcon, TruckIconName } from './Icons';

export type LedColorVariant = 'green' | 'amber' | 'red' | 'blue' | 'cyan';

interface RockerSwitchProps {
  label: string;
  subLabel?: string;
  icon: TruckIconName;
  active?: boolean;
  ledColor?: LedColorVariant;
  momentary?: boolean;
  hazardStyle?: boolean;
  guarded?: boolean;
  blinkingOff?: boolean;
  backlight?: number;
  compact?: boolean;
  onPress?: () => void;
  onPressIn?: () => void;
  onPressOut?: () => void;
}

const FILL: Record<LedColorVariant, string> = {
  green: '#12b76a',
  amber: '#ff8a00',
  red: '#f04438',
  blue: '#2f6bff',
  cyan: '#06a8c9',
};

export const RockerSwitch: React.FC<RockerSwitchProps> = ({
  label,
  subLabel,
  icon,
  active = false,
  ledColor = 'cyan',
  momentary = false,
  hazardStyle = false,
  guarded = false,
  blinkingOff = false,
  onPress,
  onPressIn,
  onPressOut,
}) => {
  const [holding, setHolding] = useState(false);
  const [h, setH] = useState(60);
  const tight = h < 50;
  const on = (momentary ? holding : active) && !blinkingOff;
  const fill = hazardStyle ? FILL.red : FILL[ledColor];

  const bg = on ? fill : hazardStyle ? '#fff1f0' : '#ffffff';
  const fg = on ? '#ffffff' : hazardStyle ? '#f04438' : CockpitTheme.ink;
  const tagColor = on ? 'rgba(255,255,255,0.75)' : CockpitTheme.muted;

  return (
    <Pressable
      onLayout={(e) => setH(e.nativeEvent.layout.height)}
      onPressIn={() => {
        setHolding(true);
        if (guarded) CockpitHaptics.heavyClunk();
        else CockpitHaptics.switchClick();
        onPressIn?.();
      }}
      onPressOut={() => {
        setHolding(false);
        if (momentary) CockpitHaptics.tick();
        onPressOut?.();
      }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.tile,
        { backgroundColor: bg },
        !on && { boxShadow: CockpitTheme.shadowSoft },
        on && { boxShadow: `0 4px 12px ${fill}55` },
        pressed && { transform: [{ scale: 0.95 }] },
      ]}
    >
      <View style={styles.topRow} pointerEvents="none">
        <View style={[styles.dot, { backgroundColor: on ? '#ffffff' : guarded ? '#f04438' : '#d9d4c9' }]} />
        {subLabel ? (
          <Text allowFontScaling={false} numberOfLines={1} style={[styles.tag, { color: tagColor }]}>
            {subLabel}
          </Text>
        ) : null}
      </View>
      <View style={[styles.center, tight && { paddingTop: 5 }]}>
        <TruckIcon name={icon} size={tight ? 15 : 20} color={fg} />
        <Text allowFontScaling={false} numberOfLines={1} style={[styles.label, { color: fg }]}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    borderRadius: 14,
    paddingHorizontal: 6,
    paddingTop: 6,
    paddingBottom: 5,
    overflow: 'hidden',
  },
  topRow: {
    position: 'absolute',
    top: 5,
    left: 6,
    right: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  tag: {
    fontSize: 8.5,
    fontWeight: '700',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingTop: 8,
  },
  label: {
    fontSize: 10.5,
    fontWeight: '700',
  },
});
