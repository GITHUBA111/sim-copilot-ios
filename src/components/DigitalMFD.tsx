import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Path, Polygon, Rect } from 'react-native-svg';
import { CockpitTheme } from '../theme/cockpitTheme';
import { TruckControllerState } from '../types/truckState';

interface DigitalMFDProps {
  state: TruckControllerState;
  onPressLinkBadge: () => void;
  onToggleSound: () => void;
  onSwitchToFs25: () => void;
}

const START = 135;
const SWEEP = 270;
const SIZE = 118;
const C = SIZE / 2;
const R = 50;

function polar(r: number, deg: number) {
  const rad = (deg * Math.PI) / 180;
  return { x: C + r * Math.cos(rad), y: C + r * Math.sin(rad) };
}

function arc(startDeg: number, endDeg: number): string {
  const e = Math.max(startDeg + 0.4, endDeg);
  const s = polar(R, startDeg);
  const p = polar(R, e);
  return `M ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${R} ${R} 0 ${e - startDeg > 180 ? 1 : 0} 1 ${p.x.toFixed(2)} ${p.y.toFixed(2)}`;
}

const Ring: React.FC<{
  ratio: number;
  color: string;
  marker?: number;
  zones?: Array<{ from: number; to: number; color: string }>;
}> = ({ ratio, color, marker, zones }) => {
  const r = Math.max(0, Math.min(1, ratio));
  const tip = polar(R, START + r * SWEEP);
  const mk = marker !== undefined ? START + Math.max(0, Math.min(1, marker)) * SWEEP : null;
  return (
    <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
      <Path d={arc(START, START + SWEEP)} stroke={CockpitTheme.track} strokeWidth={9} strokeLinecap="round" fill="none" />
      {zones?.map((z, i) => (
        <Path
          key={i}
          d={arc(START + z.from * SWEEP, START + z.to * SWEEP)}
          stroke={z.color}
          strokeWidth={9}
          fill="none"
          opacity={0.35}
        />
      ))}
      {r > 0.005 && (
        <Path d={arc(START, START + r * SWEEP)} stroke={color} strokeWidth={9} strokeLinecap="round" fill="none" />
      )}
      {mk !== null && (
        <Line
          x1={polar(R - 8, mk).x}
          y1={polar(R - 8, mk).y}
          x2={polar(R + 8, mk).x}
          y2={polar(R + 8, mk).y}
          stroke="#12b76a"
          strokeWidth={3}
          strokeLinecap="round"
        />
      )}
      <Circle cx={tip.x} cy={tip.y} r={3.2} fill="#ffffff" />
    </Svg>
  );
};

export const DigitalMFD: React.FC<DigitalMFDProps> = ({
  state,
  onPressLinkBadge,
  onToggleSound,
  onSwitchToFs25,
}) => {
  const leftBlink = (state.turnSignal === -1 || state.hazardLights) && state.blinkerPhaseOn;
  const rightBlink = (state.turnSignal === 1 || state.hazardLights) && state.blinkerPhaseOn;
  const highBeamOn = state.highBeam || state.flashHighBeam;

  const rpmRatio = Math.max(0, Math.min(1, state.rpm / 2500));
  const spdRatio = Math.max(0, Math.min(1, state.speedKmh / 120));
  const rpmColor = state.rpm > 2000 ? '#f04438' : state.rpm >= 1000 && state.rpm <= 1550 ? '#12b76a' : CockpitTheme.ink;
  const spdColor = state.speedKmh > 92 ? '#ff6a1a' : CockpitTheme.ink;
  const laneShift = Math.max(-8, Math.min(8, (state.steeringAngle / 450) * 8));
  const gearColor =
    state.driveSelector === 'R' ? '#f04438' : state.driveSelector === 'D' ? '#12b76a' : CockpitTheme.ink;

  const lamps: Array<{ t: string; on: boolean; c: string }> = [
    { t: state.headlightMode === 2 ? '近光' : '示宽', on: state.headlightMode >= 1, c: '#12b76a' },
    { t: '远光', on: highBeamOn, c: '#2f6bff' },
    { t: '手刹', on: state.parkingBrake, c: '#f04438' },
    {
      t: state.retarderLevel > 0 ? `缓速${state.retarderLevel}` : '差速',
      on: state.retarderLevel > 0 || state.diffLock,
      c: '#ff8a00',
    },
  ];

  return (
    <View style={styles.row}>
      {/* SPEED */}
      <View style={styles.dialCard}>
        <Ring
          ratio={spdRatio}
          color={spdColor}
          marker={state.cruiseEnabled ? state.cruiseSpeedKmh / 120 : undefined}
        />
        <View pointerEvents="none" style={styles.dialCenter}>
          <Text style={styles.bigNum}>{Math.round(state.speedKmh)}</Text>
          <Text style={styles.unit}>KM/H</Text>
        </View>
      </View>

      {/* CENTER */}
      <View style={styles.center}>
        <View style={styles.topRow}>
          <View style={[styles.arrow, leftBlink && styles.arrowOn]}>
            <Text style={[styles.arrowTxt, leftBlink && { color: '#ffffff' }]}>◀</Text>
          </View>
          <Pressable onPress={onSwitchToFs25} style={styles.fsSwitchChip}>
            <Text style={styles.fsSwitchTxt}>⊞ 换座舱</Text>
          </Pressable>
          <Pressable onPress={onToggleSound} style={styles.chip}>
            <Text style={styles.chipTxt}>{state.soundEnabled ? '🔊' : '🔇'}</Text>
          </Pressable>
          <Pressable onPress={onPressLinkBadge} style={styles.chip}>
            <View style={[styles.statusDot, { backgroundColor: state.wsConnected ? '#12b76a' : '#ff8a00' }]} />
            <Text style={styles.chipTxt}>{state.wsConnected ? '在线' : '试驾'}</Text>
          </Pressable>
          <View style={[styles.arrow, rightBlink && styles.arrowOn]}>
            <Text style={[styles.arrowTxt, rightBlink && { color: '#ffffff' }]}>▶</Text>
          </View>
        </View>

        <View style={styles.lane}>
          <View pointerEvents="none">
            <Svg width={150} height={42} viewBox="0 0 150 42">
              <Polygon
                points={`${62 + laneShift * 0.4},2 ${88 + laneShift * 0.4},2 ${136 + laneShift},42 ${14 + laneShift},42`}
                fill="#e9e5dd"
              />
              <Line
                x1={75 + laneShift * 0.7}
                y1={4}
                x2={75 + laneShift * 0.9}
                y2={40}
                stroke="#ffffff"
                strokeWidth={2.5}
                strokeDasharray="6 5"
              />
              <Rect x={65} y={20} width={20} height={18} rx={5} fill={CockpitTheme.ink} />
              <Rect x={68} y={23} width={14} height={6} rx={2} fill="#ffffff" opacity={0.85} />
              {state.laneKeepAssist && (
                <Path d="M 40 8 L 36 38 M 110 8 L 114 38" stroke="#12b76a" strokeWidth={3} strokeLinecap="round" />
              )}
            </Svg>
          </View>
          {state.speedLimiter && (
            <View style={styles.limit}>
              <Text style={styles.limitTxt}>90</Text>
            </View>
          )}
          {state.cruiseEnabled && (
            <View style={styles.cc}>
              <Text style={styles.ccTxt}>ACC {state.cruiseSpeedKmh}</Text>
            </View>
          )}
        </View>

        <View style={styles.lampRow}>
          {lamps.map((l) => (
            <View key={l.t} style={[styles.lamp, l.on && { backgroundColor: l.c }]}>
              <Text style={[styles.lampTxt, l.on && { color: '#ffffff' }]}>{l.t}</Text>
            </View>
          ))}
        </View>

        <Text numberOfLines={1} style={styles.ticker}>
          气压 {state.airPressureBar.toFixed(1)} bar · 油量 {Math.round(state.fuelRatio * 100)}% · {state.lastCommandTag}
        </Text>
      </View>

      {/* RPM */}
      <View style={styles.dialCard}>
        <Ring
          ratio={rpmRatio}
          color={rpmColor}
          zones={[
            { from: 0.4, to: 0.62, color: '#12b76a' },
            { from: 0.8, to: 1, color: '#f04438' },
          ]}
        />
        <View pointerEvents="none" style={styles.dialCenter}>
          <Text style={[styles.bigNum, { color: gearColor }]}>{state.gearDisplay}</Text>
          <Text style={styles.unit}>{Math.round(state.rpm)} RPM</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dialCard: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: CockpitTheme.shadowLift,
  },
  dialCenter: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigNum: {
    fontSize: 34,
    fontWeight: '800',
    color: CockpitTheme.ink,
    letterSpacing: -1,
    fontVariant: ['tabular-nums'],
  },
  unit: {
    marginTop: -2,
    fontSize: 9.5,
    fontWeight: '700',
    color: CockpitTheme.muted,
    letterSpacing: 0.8,
  },
  center: {
    flex: 1,
    height: SIZE,
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 5,
  },
  arrow: {
    width: 26,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: CockpitTheme.shadowSoft,
  },
  arrowOn: {
    backgroundColor: '#12b76a',
  },
  arrowTxt: {
    fontSize: 9,
    color: CockpitTheme.muted,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#ffffff',
    boxShadow: CockpitTheme.shadowSoft,
  },
  fsSwitchChip: {
    paddingHorizontal: 8,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#ecfdf3',
    borderWidth: 1,
    borderColor: '#abefc6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fsSwitchTxt: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#15803d',
  },
  chipTxt: {
    fontSize: 9.5,
    fontWeight: '700',
    color: CockpitTheme.inkSoft,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  lane: {
    height: 46,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    boxShadow: CockpitTheme.shadowSoft,
  },
  gearBadge: {
    position: 'absolute',
    left: 8,
    top: 6,
  },
  gearTxt: {
    fontSize: 15,
    fontWeight: '800',
  },
  limit: {
    position: 'absolute',
    right: 8,
    top: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2.5,
    borderColor: '#f04438',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  limitTxt: {
    fontSize: 8.5,
    fontWeight: '800',
    color: CockpitTheme.ink,
  },
  cc: {
    position: 'absolute',
    right: 8,
    bottom: 5,
    paddingHorizontal: 5,
    borderRadius: 6,
    backgroundColor: '#e8f8f0',
  },
  ccTxt: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#12b76a',
  },
  lampRow: {
    flexDirection: 'row',
    gap: 5,
  },
  lamp: {
    flex: 1,
    height: 20,
    borderRadius: 10,
    backgroundColor: CockpitTheme.track,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lampTxt: {
    fontSize: 9.5,
    fontWeight: '800',
    color: CockpitTheme.muted,
  },
  ticker: {
    fontSize: 9,
    fontWeight: '600',
    color: CockpitTheme.muted,
    textAlign: 'center',
  },
});
