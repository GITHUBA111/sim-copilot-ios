import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Path, Polygon, Rect } from 'react-native-svg';
import { CockpitTheme } from '../theme/cockpitTheme';
import { FS25_TOOL_SLOTS, Fs25ControllerState } from '../types/fs25State';
import { CockpitHaptics } from '../utils/haptics';

interface TractorMFDProps {
  fs: Fs25ControllerState;
  steeringAngle: number;
  blinkerPhaseOn: boolean;
  wsConnected: boolean;
  soundEnabled: boolean;
  lastCommandTag: string;
  onSwitchToEts2: () => void;
  onToggleLayout: () => void;
  onPressLinkBadge: () => void;
  onToggleSound: () => void;
}

const START = 135;
const SWEEP = 270;
const SIZE = 106;
const C = SIZE / 2;
const R = 44;
const AGRI_GREEN = '#15803d';
const AGRI_AMBER = '#d97706';

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
      <Path d={arc(START, START + SWEEP)} stroke={CockpitTheme.track} strokeWidth={8.5} strokeLinecap="round" fill="none" />
      {zones?.map((z, i) => (
        <Path
          key={i}
          d={arc(START + z.from * SWEEP, START + z.to * SWEEP)}
          stroke={z.color}
          strokeWidth={8.5}
          fill="none"
          opacity={0.35}
        />
      ))}
      {r > 0.005 && (
        <Path d={arc(START, START + r * SWEEP)} stroke={color} strokeWidth={8.5} strokeLinecap="round" fill="none" />
      )}
      {mk !== null && (
        <Line
          x1={polar(R - 7, mk).x}
          y1={polar(R - 7, mk).y}
          x2={polar(R + 7, mk).x}
          y2={polar(R + 7, mk).y}
          stroke={AGRI_GREEN}
          strokeWidth={3}
          strokeLinecap="round"
        />
      )}
      <Circle cx={tip.x} cy={tip.y} r={3} fill="#ffffff" />
    </Svg>
  );
};

const LIGHT_LABELS = ['灯关', '近光', '后工灯', '全工灯'] as const;

export const TractorMFD: React.FC<TractorMFDProps> = ({
  fs,
  steeringAngle,
  blinkerPhaseOn,
  wsConnected,
  soundEnabled,
  lastCommandTag,
  onSwitchToEts2,
  onToggleLayout,
  onPressLinkBadge,
  onToggleSound,
}) => {
  const leftBlink = (fs.turnSignal === -1 || fs.hazardLights) && blinkerPhaseOn;
  const rightBlink = (fs.turnSignal === 1 || fs.hazardLights) && blinkerPhaseOn;
  const beaconBlink = fs.beacon && blinkerPhaseOn;

  const spdRatio = Math.max(0, Math.min(1, fs.speedKmh / 55));
  const rpmRatio = Math.max(0, Math.min(1, fs.rpm / 2400));
  const rpmColor =
    fs.rpm > 2050 ? '#f04438' : fs.ptoActive ? AGRI_AMBER : AGRI_GREEN;
  const shuttleColor =
    fs.shuttleDir === 'R' ? '#f04438' : fs.shuttleDir === 'F' ? AGRI_GREEN : CockpitTheme.ink;
  const laneShift = Math.max(-8, Math.min(8, (steeringAngle / 450) * 8));

  const lamps: Array<{ t: string; on: boolean; c: string }> = [
    { t: LIGHT_LABELS[fs.lightStage], on: fs.lightStage > 0, c: AGRI_GREEN },
    { t: '警示', on: beaconBlink, c: AGRI_AMBER },
    { t: 'PTO', on: fs.ptoActive, c: AGRI_AMBER },
    { t: 'GPS', on: fs.gpsActive, c: '#2f6bff' },
    { t: '雇工', on: fs.aiWorkerActive, c: AGRI_GREEN },
  ];

  return (
    <View style={styles.row}>
      {/* LEFT DIAL: FIELD SPEEDOMETER (0-55 KM/H) */}
      <View style={styles.dialCard}>
        <Ring
          ratio={spdRatio}
          color={AGRI_GREEN}
          marker={fs.cruiseEnabled ? fs.cruiseTargetKmh / 55 : undefined}
        />
        <View pointerEvents="none" style={styles.dialCenter}>
          <Text style={styles.bigNum}>{Math.round(fs.speedKmh)}</Text>
          <Text style={styles.unit}>KM/H</Text>
        </View>
      </View>

      {/* CENTER PRECISION FARMING & MODE BAR */}
      <View style={styles.center}>
        <View style={styles.topRow}>
          <View style={[styles.arrow, leftBlink && styles.arrowOn]}>
            <Text style={[styles.arrowTxt, leftBlink && { color: '#ffffff' }]}>◀</Text>
          </View>

          <Pressable
            onPress={() => {
              CockpitHaptics.switchClick();
              onSwitchToEts2();
            }}
            style={styles.gameSwitchChip}
          >
            <Text style={styles.gameSwitchTxt}>⊞ 换座舱</Text>
          </Pressable>

          <Pressable
            onPress={() => {
              CockpitHaptics.switchClick();
              onToggleLayout();
            }}
            style={[styles.layoutChip, fs.layout === 'sidepanel' && styles.layoutChipSide]}
          >
            <Text style={[styles.layoutChipTxt, fs.layout === 'sidepanel' && { color: '#ffffff' }]}>
              {fs.layout === 'sidepanel' ? '🕹️侧台' : '🚜全驾'}
            </Text>
          </Pressable>

          <Pressable onPress={onToggleSound} style={styles.chip}>
            <Text style={styles.chipTxt}>{soundEnabled ? '🔊' : '🔇'}</Text>
          </Pressable>

          <Pressable onPress={onPressLinkBadge} style={styles.chip}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: wsConnected ? '#12b76a' : AGRI_AMBER },
              ]}
            />
            <Text style={styles.chipTxt}>{wsConnected ? '在线' : '试驾'}</Text>
          </Pressable>

          <View style={[styles.arrow, rightBlink && styles.arrowOn]}>
            <Text style={[styles.arrowTxt, rightBlink && { color: '#ffffff' }]}>▶</Text>
          </View>
        </View>

        {/* FS25 Crop Furrow & GPS Steering Assist Visualizer */}
        <View style={styles.fieldCanvas}>
          <View pointerEvents="none">
            <Svg width={154} height={38} viewBox="0 0 154 38">
              <Polygon
                points={`${58 + laneShift * 0.4},2 ${96 + laneShift * 0.4},2 ${144 + laneShift},38 ${10 + laneShift},38`}
                fill="#e6efe4"
              />
              <Line
                x1={66 + laneShift * 0.5}
                y1={4}
                x2={44 + laneShift * 0.9}
                y2={36}
                stroke="#bdd8b6"
                strokeWidth={2}
              />
              <Line
                x1={88 + laneShift * 0.5}
                y1={4}
                x2={110 + laneShift * 0.9}
                y2={36}
                stroke="#bdd8b6"
                strokeWidth={2}
              />
              <Line
                x1={77 + laneShift * 0.5}
                y1={3}
                x2={77 + laneShift * 0.8}
                y2={36}
                stroke={fs.gpsActive ? '#2f6bff' : '#ffffff'}
                strokeWidth={2.5}
                strokeDasharray="5 4"
              />
              {fs.gpsActive && (
                <Path
                  d="M 38 6 L 26 35 M 116 6 L 128 35"
                  stroke="#2f6bff"
                  strokeWidth={2.6}
                  strokeLinecap="round"
                />
              )}
              <Rect x={68} y={14} width={18} height={15} rx={4} fill={AGRI_GREEN} />
              <Rect x={71} y={16} width={12} height={6} rx={2} fill="#ffffff" opacity={0.9} />
              {fs.toolLowered && (
                <Rect x={61} y={30} width={32} height={5} rx={2} fill={AGRI_AMBER} />
              )}
            </Svg>
          </View>

          <View style={styles.slotBadge}>
            <Text style={styles.slotBadgeTxt}>{FS25_TOOL_SLOTS[fs.activeToolSlot]}</Text>
          </View>

          {fs.cruiseEnabled && (
            <View style={styles.ccBadge}>
              <Text style={styles.ccBadgeTxt}>CC {fs.cruiseTargetKmh}</Text>
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
          {fs.toolLowered ? '农具作业中' : '农具抬起'} · {lastCommandTag}
        </Text>
      </View>

      {/* RIGHT DIAL: SHUTTLE GEAR & PTO RPM */}
      <View style={styles.dialCard}>
        <Ring
          ratio={rpmRatio}
          color={rpmColor}
          zones={[
            { from: 0.52, to: 0.78, color: AGRI_GREEN },
            { from: 0.85, to: 1, color: '#f04438' },
          ]}
        />
        <View pointerEvents="none" style={styles.dialCenter}>
          <Text style={[styles.bigNum, { color: shuttleColor }]}>{fs.shuttleDir}</Text>
          <Text style={styles.unit}>{Math.round(fs.rpm)} RPM</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
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
    fontSize: 30,
    fontWeight: '800',
    color: CockpitTheme.ink,
    letterSpacing: -0.8,
    fontVariant: ['tabular-nums'],
  },
  unit: {
    marginTop: -2,
    fontSize: 9,
    fontWeight: '700',
    color: CockpitTheme.muted,
    letterSpacing: 0.6,
  },
  center: {
    flex: 1,
    height: SIZE + 6,
    justifyContent: 'space-between',
    paddingVertical: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
  },
  arrow: {
    width: 22,
    height: 21,
    borderRadius: 10.5,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: CockpitTheme.shadowSoft,
  },
  arrowOn: {
    backgroundColor: '#12b76a',
  },
  arrowTxt: {
    fontSize: 8.5,
    color: CockpitTheme.muted,
  },
  gameSwitchChip: {
    paddingHorizontal: 7,
    height: 21,
    borderRadius: 10.5,
    backgroundColor: '#fff0e6',
    borderWidth: 1,
    borderColor: '#ffd6bd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gameSwitchTxt: {
    fontSize: 9,
    fontWeight: '800',
    color: '#c2410c',
  },
  layoutChip: {
    paddingHorizontal: 7,
    height: 21,
    borderRadius: 10.5,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: CockpitTheme.shadowSoft,
  },
  layoutChipSide: {
    backgroundColor: AGRI_GREEN,
  },
  layoutChipTxt: {
    fontSize: 9,
    fontWeight: '800',
    color: CockpitTheme.inkSoft,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    height: 21,
    borderRadius: 10.5,
    backgroundColor: '#ffffff',
    boxShadow: CockpitTheme.shadowSoft,
  },
  chipTxt: {
    fontSize: 9,
    fontWeight: '700',
    color: CockpitTheme.inkSoft,
  },
  statusDot: {
    width: 5.5,
    height: 5.5,
    borderRadius: 3,
  },
  fieldCanvas: {
    height: 40,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    boxShadow: CockpitTheme.shadowSoft,
  },
  slotBadge: {
    position: 'absolute',
    left: 6,
    top: 5,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 5,
    backgroundColor: '#fef3c7',
  },
  slotBadgeTxt: {
    fontSize: 8,
    fontWeight: '800',
    color: '#92400e',
  },
  ccBadge: {
    position: 'absolute',
    right: 6,
    bottom: 4,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 5,
    backgroundColor: '#dcfce7',
  },
  ccBadgeTxt: {
    fontSize: 8,
    fontWeight: '800',
    color: AGRI_GREEN,
  },
  lampRow: {
    flexDirection: 'row',
    gap: 4,
  },
  lamp: {
    flex: 1,
    height: 19,
    borderRadius: 9.5,
    backgroundColor: CockpitTheme.track,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lampTxt: {
    fontSize: 8.5,
    fontWeight: '800',
    color: CockpitTheme.muted,
  },
  ticker: {
    fontSize: 8.5,
    fontWeight: '600',
    color: CockpitTheme.muted,
    textAlign: 'center',
  },
});
