import React, { useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Line } from 'react-native-svg';
import { CockpitTheme } from '../theme/cockpitTheme';
import { CockpitHaptics } from '../utils/haptics';

interface RotaryOption {
  label: string;
  short: string;
}

interface RotaryDialProps {
  title: string;
  options: RotaryOption[];
  valueIndex: number;
  accentColor?: string;
  onChange: (nextIndex: number) => void;
}

export const RotaryDial: React.FC<RotaryDialProps> = ({
  title,
  options,
  valueIndex,
  accentColor = CockpitTheme.amberBacklight,
  onChange,
}) => {
  const startXRef = useRef<number | null>(null);
  const startIdxRef = useRef<number>(valueIndex);

  const count = options.length;
  const angleSpan = 110;
  const startDeg = -angleSpan / 2;
  const stepDeg = count > 1 ? angleSpan / (count - 1) : 0;
  const currentDeg = startDeg + valueIndex * stepDeg;

  const stepNext = () => {
    const next = (valueIndex + 1) % count;
    CockpitHaptics.switchClick();
    onChange(next);
  };

  return (
    <View
      style={styles.card}
      onTouchStart={(e) => {
        const t = e.nativeEvent.changedTouches[0];
        if (t) {
          startXRef.current = t.pageX;
          startIdxRef.current = valueIndex;
        }
      }}
      onTouchMove={(e) => {
        const t = e.nativeEvent.changedTouches[0];
        if (!t || startXRef.current === null) return;
        const dx = t.pageX - startXRef.current;
        const deltaSteps = Math.round(dx / 26);
        const target = Math.max(0, Math.min(count - 1, startIdxRef.current + deltaSteps));
        if (target !== valueIndex) {
          CockpitHaptics.tick();
          onChange(target);
        }
      }}
      onTouchEnd={() => {
        startXRef.current = null;
      }}
    >
      <Text style={styles.title}>{title}</Text>

      {/* Detent Labels Row */}
      <View style={styles.detentsRow}>
        {options.map((opt, idx) => {
          const active = idx === valueIndex;
          return (
            <Pressable
              key={opt.short}
              onPress={() => {
                if (idx !== valueIndex) {
                  CockpitHaptics.switchClick();
                  onChange(idx);
                }
              }}
              style={[
                styles.detentPill,
                active && { borderColor: accentColor, backgroundColor: 'rgba(217,119,6,0.14)' },
              ]}
            >
              <Text style={[styles.detentText, active && { color: accentColor, fontWeight: '800' }]}>
                {opt.short}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Brushed Satin Aluminum Knurled Rotary Knob */}
      <Pressable onPress={stepNext} style={styles.knobWrap}>
        <LinearGradient
          colors={['#ffffff', '#e7e3da', '#cfc9bd']}
          style={styles.knobOuter}
        >
          <View
            style={[
              styles.knobPointerCarrier,
              { transform: [{ rotate: `${currentDeg}deg` }] },
            ]}
          >
            <Svg width={46} height={46} viewBox="0 0 54 54">
              <Circle cx="27" cy="27" r="22" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="3 3" fill="none" />
              <Line
                x1="27"
                y1="7"
                x2="27"
                y2="20"
                stroke={valueIndex > 0 ? accentColor : '#475569'}
                strokeWidth="3.5"
                strokeLinecap="round"
              />
            </Svg>
          </View>
        </LinearGradient>
      </Pressable>

      <Text style={[styles.statusText, valueIndex > 0 && { color: accentColor }]}>
        {options[valueIndex]?.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1.15,
    backgroundColor: '#f5f2ec',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#c5beb0',
    paddingVertical: 5,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 10,
    fontWeight: '800',
    color: CockpitTheme.mutedLabel,
    letterSpacing: 0.3,
  },
  detentsRow: {
    flexDirection: 'row',
    gap: 3,
    marginVertical: 2,
  },
  detentPill: {
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#d1cbc0',
    backgroundColor: '#ebe7df',
  },
  detentText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#64748b',
  },
  knobWrap: {
    marginVertical: 2,
  },
  knobOuter: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#b5ae9f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  knobPointerCarrier: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#475569',
  },
});
