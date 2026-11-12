import React, { useEffect, useRef, useState } from 'react';
import {
  LayoutChangeEvent,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, {
  Circle,
  Defs,
  G,
  Line,
  LinearGradient as SvgLinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
  Text as SvgText,
} from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { CockpitTheme } from '../theme/cockpitTheme';
import { SteeringLockRange, TurnSignalState } from '../types/truckState';
import { CockpitHaptics } from '../utils/haptics';

interface SteeringColumnProps {
  steeringAngle: number;
  steeringLock: SteeringLockRange;
  steeringSensitivity: number;
  speedKmh: number;
  turnSignal: TurnSignalState;
  blinkerPhaseOn: boolean;
  highBeam: boolean;
  retarderLevel: number;
  exhaustBrake: boolean;
  cruiseEnabled: boolean;
  cruiseSpeedKmh: number;
  brandTitle?: string;
  brandSub?: string;
  accentColor?: string;
  onSteeringChange: (angleDeg: number) => void;
  onTurnSignalChange: (next: TurnSignalState, tag?: string) => void;
  onToggleHighBeam: () => void;
  onFlashHighBeam: (down: boolean) => void;
  onRetarderChange: (level: number) => void;
  onToggleExhaustBrake: () => void;
  onHornChange: (down: boolean, air: boolean) => void;
  onCruiseToggle: () => void;
  onCruiseAdjust: (deltaKmh: number) => void;
}

const HALO_BEADS = 24;

export const SteeringColumn: React.FC<SteeringColumnProps> = ({
  steeringAngle,
  steeringLock,
  steeringSensitivity,
  speedKmh,
  turnSignal,
  blinkerPhaseOn,
  highBeam,
  retarderLevel,
  cruiseEnabled,
  cruiseSpeedKmh,
  brandTitle = 'SCANIA',
  brandSub = 'TRUCK',
  accentColor = '#ff6a1a',
  onSteeringChange,
  onTurnSignalChange,
  onToggleHighBeam,
  onFlashHighBeam,
  onRetarderChange,
  onHornChange,
  onCruiseToggle,
  onCruiseAdjust,
}) => {
  const [boxSize, setBoxSize] = useState({ width: 190, height: 220 });
  const wheelZoneRef = useRef<React.ComponentRef<typeof View>>(null);
  const wheelPageCenterRef = useRef({ cx: 0, cy: 0 });

  const angleRef = useRef(steeringAngle);
  const velocityRef = useRef(0);
  const isDraggingRef = useRef(false);
  const activeTouchIdRef = useRef<number | string | null>(null);
  const lastTouchAngleRef = useRef(0);
  const armedSelfCancelRef = useRef<TurnSignalState>(0);
  const hitLockRef = useRef(false);

  const speedRef = useRef(speedKmh);
  const lockRef = useRef(steeringLock);
  const sensRef = useRef(steeringSensitivity);
  const turnSignalRef = useRef(turnSignal);
  const onSteeringChangeRef = useRef(onSteeringChange);
  const onTurnSignalChangeRef = useRef(onTurnSignalChange);

  speedRef.current = speedKmh;
  lockRef.current = steeringLock;
  sensRef.current = steeringSensitivity;
  turnSignalRef.current = turnSignal;
  onSteeringChangeRef.current = onSteeringChange;
  onTurnSignalChangeRef.current = onTurnSignalChange;

  useEffect(() => {
    if (!isDraggingRef.current && Math.abs(steeringAngle - angleRef.current) > 1) {
      angleRef.current = steeringAngle;
    }
  }, [steeringAngle]);

  useEffect(() => {
    if (turnSignal === 0) armedSelfCancelRef.current = 0;
  }, [turnSignal]);

  const refreshWheelCenter = () => {
    wheelZoneRef.current?.measureInWindow((x, y, w, h) => {
      if (w > 0 && h > 0) {
        wheelPageCenterRef.current = { cx: x + w / 2, cy: y + h / 2 };
      }
    });
  };

  const handleLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setBoxSize({ width, height });
    setTimeout(refreshWheelCenter, 30);
  };

  const applyNewAngle = (nextRaw: number) => {
    const halfLock = lockRef.current / 2;
    const prev = angleRef.current;
    const clamped = Math.max(-halfLock, Math.min(halfLock, nextRaw));

    if ((prev < -1.5 && clamped >= -1.5) || (prev > 1.5 && clamped <= 1.5)) {
      CockpitHaptics.tick();
    }

    if (Math.abs(clamped) >= halfLock - 0.5) {
      if (!hitLockRef.current) {
        hitLockRef.current = true;
        CockpitHaptics.heavyClunk();
      }
    } else if (Math.abs(clamped) < halfLock - 8) {
      hitLockRef.current = false;
    }

    const ts = turnSignalRef.current;
    if (ts === 1 && clamped > 85) armedSelfCancelRef.current = 1;
    else if (ts === -1 && clamped < -85) armedSelfCancelRef.current = -1;

    if (armedSelfCancelRef.current === 1 && clamped <= 18) {
      armedSelfCancelRef.current = 0;
      CockpitHaptics.switchClick();
      onTurnSignalChangeRef.current(0, 'BLINKER AUTO-OFF · 自动回位');
    } else if (armedSelfCancelRef.current === -1 && clamped >= -18) {
      armedSelfCancelRef.current = 0;
      CockpitHaptics.switchClick();
      onTurnSignalChangeRef.current(0, 'BLINKER AUTO-OFF · 自动回位');
    }

    angleRef.current = clamped;
    onSteeringChangeRef.current(clamped);
  };

  useEffect(() => {
    let rafId: number;
    let lastTime = Date.now();

    const step = () => {
      const now = Date.now();
      const dt = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000));
      lastTime = now;

      if (!isDraggingRef.current && Math.abs(angleRef.current) > 0.08) {
        const spd = Math.abs(speedRef.current);
        {
          const speedFactor = Math.max(0.35, Math.pow(Math.min(110, spd) / 75, 0.85));
          const maxReturnDegPerSec = 540 * speedFactor;
          const springStiffness = 4.4 * speedFactor;

          const desiredVel = -angleRef.current * springStiffness;
          const clampedVel = Math.max(-maxReturnDegPerSec, Math.min(maxReturnDegPerSec, desiredVel));

          velocityRef.current += (clampedVel - velocityRef.current) * Math.min(1, dt * 14);
          let next = angleRef.current + velocityRef.current * dt;

          if (Math.abs(next) < 0.35 && Math.abs(velocityRef.current) < 12) {
            next = 0;
            velocityRef.current = 0;
          }
          applyNewAngle(next);
        }
      }

      rafId = requestAnimationFrame(step);
    };

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, []);

  const computeAngleFromPageXY = (pageX: number, pageY: number, locX?: number, locY?: number) => {
    const { cx, cy } = wheelPageCenterRef.current;
    if (cx !== 0 || cy !== 0) {
      return Math.atan2(pageY - cy, pageX - cx) * (180 / Math.PI);
    }
    const fallbackCx = boxSize.width / 2;
    const fallbackCy = boxSize.height / 2;
    return Math.atan2((locY ?? fallbackCy) - fallbackCy, (locX ?? fallbackCx) - fallbackCx) * (180 / Math.PI);
  };

  const retarderTrackHeight = useRef(150);
  const handleRetarderTouch = (locY: number) => {
    const h = Math.max(80, retarderTrackHeight.current);
    const ratio = Math.max(0, Math.min(1, locY / h));
    const stage = Math.round(ratio * 5);
    if (stage !== retarderLevel) {
      CockpitHaptics.tick();
      onRetarderChange(stage);
    }
  };

  const wheelDiameter = Math.max(154, Math.min(boxSize.width - 2, boxSize.height - 2, 238));
  const halfLock = steeringLock / 2;
  const normAxis = steeringAngle / halfLock;
  const activeBeads = Math.round(Math.abs(normAxis) * (HALO_BEADS / 2));

  const webPointerProps =
    Platform.OS === 'web'
      ? {
          onPointerDown: (e: any) => {
            refreshWheelCenter();
            activeTouchIdRef.current = e.pointerId ?? 'mouse';
            isDraggingRef.current = true;
            velocityRef.current = 0;
            e.currentTarget?.setPointerCapture?.(e.pointerId);
            lastTouchAngleRef.current = computeAngleFromPageXY(e.pageX, e.pageY);
          },
          onPointerMove: (e: any) => {
            if (!isDraggingRef.current) return;
            const cur = computeAngleFromPageXY(e.pageX, e.pageY);
            let delta = cur - lastTouchAngleRef.current;
            if (delta > 180) delta -= 360;
            if (delta < -180) delta += 360;
            lastTouchAngleRef.current = cur;
            applyNewAngle(angleRef.current + delta * sensRef.current);
          },
          onPointerUp: () => {
            isDraggingRef.current = false;
            activeTouchIdRef.current = null;
          },
        }
      : {};

  return (
    <LinearGradient colors={['#f3f1ec', '#f3f1ec']} style={styles.container}>
      {/* Top Daylight Brushed-Silver Turn Signal Collar */}
      <View style={styles.collarBar}>
        <Pressable
          onPress={() => {
            CockpitHaptics.switchClick();
            onTurnSignalChange(turnSignal === -1 ? 0 : -1, 'LEFT TURN · 左转向灯');
          }}
          style={[
            styles.signalPaddle,
            turnSignal === -1 && blinkerPhaseOn && styles.signalPaddleActive,
          ]}
        >
          <Text
            allowFontScaling={false}
            numberOfLines={1}
            style={[styles.signalArrow, turnSignal === -1 && { color: '#ffffff' }]}
          >
            ◄ 左转
          </Text>
        </Pressable>

        <Pressable
          onPress={() => {
            CockpitHaptics.switchClick();
            velocityRef.current = 0;
            applyNewAngle(0);
          }}
          style={styles.angleCenterPill}
        >
          <Text allowFontScaling={false} numberOfLines={1} style={styles.angleNum}>
            {steeringAngle > 0.4 ? '+' : ''}
            {steeringAngle.toFixed(0)}°
          </Text>
          <Text allowFontScaling={false} numberOfLines={1} style={styles.angleResetHint}>
            归零
          </Text>
        </Pressable>

        <Pressable
          onPress={() => {
            CockpitHaptics.switchClick();
            onTurnSignalChange(turnSignal === 1 ? 0 : 1, 'RIGHT TURN · 右转向灯');
          }}
          style={[
            styles.signalPaddle,
            turnSignal === 1 && blinkerPhaseOn && styles.signalPaddleActive,
          ]}
        >
          <Text
            allowFontScaling={false}
            numberOfLines={1}
            style={[styles.signalArrow, turnSignal === 1 && { color: '#ffffff' }]}
          >
            右转 ►
          </Text>
        </Pressable>
      </View>

      {/* Main Middle Stage: Left Stalk Buttons + Chronograph Wheel + Right Retarder Scale */}
      <View style={styles.wheelStage}>
        {/* Chronograph Bezel Halo + Two-Tone Pearl-Grey & Brushed Aluminum Wheel */}
        <View
          ref={wheelZoneRef}
          onLayout={handleLayout}
          style={styles.wheelTouchArea}
          onTouchStart={(e) => {
            if (activeTouchIdRef.current !== null) return;
            const t = e.nativeEvent.changedTouches[0];
            if (!t) return;
            refreshWheelCenter();
            activeTouchIdRef.current = t.identifier;
            isDraggingRef.current = true;
            velocityRef.current = 0;
            lastTouchAngleRef.current = computeAngleFromPageXY(t.pageX, t.pageY, t.locationX, t.locationY);
          }}
          onTouchMove={(e) => {
            if (!isDraggingRef.current || activeTouchIdRef.current === null) return;
            const touches = e.nativeEvent.changedTouches;
            for (let i = 0; i < touches.length; i++) {
              const t = touches[i];
              if (t.identifier === activeTouchIdRef.current) {
                const cur = computeAngleFromPageXY(t.pageX, t.pageY, t.locationX, t.locationY);
                let delta = cur - lastTouchAngleRef.current;
                if (delta > 180) delta -= 360;
                if (delta < -180) delta += 360;
                lastTouchAngleRef.current = cur;
                applyNewAngle(angleRef.current + delta * sensRef.current);
                break;
              }
            }
          }}
          onTouchEnd={(e) => {
            const touches = e.nativeEvent.changedTouches;
            for (let i = 0; i < touches.length; i++) {
              if (touches[i].identifier === activeTouchIdRef.current) {
                isDraggingRef.current = false;
                activeTouchIdRef.current = null;
                break;
              }
            }
          }}
          onTouchCancel={() => {
            isDraggingRef.current = false;
            activeTouchIdRef.current = null;
          }}
          {...webPointerProps}
        >
          <View style={{ width: wheelDiameter, height: wheelDiameter, alignItems: 'center', justifyContent: 'center' }}>
            {/* Fixed Chronograph Gauge Dial Ring + 24 Jewel LEDs */}
            <View pointerEvents="none" style={StyleSheet.absoluteFill}>
              <Svg width={wheelDiameter} height={wheelDiameter} viewBox="0 0 220 220">
                <Circle cx="110" cy="110" r="105" fill="#ffffff" stroke="#e8e4dc" strokeWidth="1.5" />
                <Circle cx="110" cy="110" r="99" stroke="#f0ede6" strokeWidth="1" fill="none" />

                {/* Watch-Grade Radial Degree Ticks around Steering Bezel */}
                {Array.from({ length: 36 }).map((_, idx) => {
                  const deg = idx * 10;
                  const rad = (deg * Math.PI) / 180;
                  const isMaj = idx % 3 === 0;
                  return (
                    <Line
                      key={`tk-${idx}`}
                      x1={110 + 105 * Math.cos(rad)}
                      y1={110 + 105 * Math.sin(rad)}
                      x2={110 + (isMaj ? 99.5 : 102) * Math.cos(rad)}
                      y2={110 + (isMaj ? 99.5 : 102) * Math.sin(rad)}
                      stroke={isMaj ? '#cfc9bd' : '#e3dfd6'}
                      strokeWidth={isMaj ? 1.2 : 0.8}
                    />
                  );
                })}

                {/* 12 Right + 12 Left Daylight Jewel LEDs */}
                {Array.from({ length: 12 }).map((_, i) => {
                  const degRight = -82 + i * 14.5;
                  const radR = (degRight * Math.PI) / 180;
                  const rx = 110 + 102.5 * Math.cos(radR);
                  const ry = 110 + 102.5 * Math.sin(radR);
                  const litRight = steeringAngle > 2 && i < activeBeads;

                  const degLeft = -98 - i * 14.5;
                  const radL = (degLeft * Math.PI) / 180;
                  const lx = 110 + 102.5 * Math.cos(radL);
                  const ly = 110 + 102.5 * Math.sin(radL);
                  const litLeft = steeringAngle < -2 && i < activeBeads;

                  const beadCol = i >= 9 ? '#f04438' : i >= 6 ? '#ff8a00' : '#2f6bff';

                  return (
                    <G key={i}>
                      <Circle cx={rx} cy={ry} r={litRight ? 3.3 : 1.9} fill={litRight ? beadCol : '#e3dfd6'} />
                      <Circle cx={lx} cy={ly} r={litLeft ? 3.3 : 1.9} fill={litLeft ? beadCol : '#e3dfd6'} />
                    </G>
                  );
                })}
                {/* 12-o'clock Index Triangle */}
                <Rect x="108" y="2" width="4" height="8" rx="2" fill="#2f6bff" />
              </Svg>
            </View>

            {/* Rotating Two-Tone Pearl-Slate Leather & Brushed Silver Steering Wheel */}
            <View
              pointerEvents="none"
              style={{
                width: wheelDiameter * 0.89,
                height: wheelDiameter * 0.89,
                transform: [{ rotate: `${steeringAngle.toFixed(1)}deg` }],
              }}
            >
              <Svg width="100%" height="100%" viewBox="0 0 200 200">
                <Defs>
                  <SvgLinearGradient id="silverSpoke" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0%" stopColor="#ffffff" />
                    <Stop offset="55%" stopColor="#f0ede6" />
                    <Stop offset="100%" stopColor="#d3cdc1" />
                  </SvgLinearGradient>
                  <RadialGradient id="ceramicHub" cx="50%" cy="35%" r="60%">
                    <Stop offset="0%" stopColor="#ffffff" />
                    <Stop offset="70%" stopColor="#eef2f7" />
                    <Stop offset="100%" stopColor="#cbd5e1" />
                  </RadialGradient>
                </Defs>

                {/* Two-Tone Warm Slate-Grey Nappa Rim (Not Black!) */}
                <Circle cx="100" cy="100" r="84" stroke="#161c2a" strokeWidth="22.5" fill="none" />
                <Circle cx="100" cy="100" r="84" stroke="#2a3350" strokeWidth="17.5" fill="none" />
                <Circle cx="100" cy="100" r="91" stroke="#cbd5e1" strokeWidth="1" fill="none" opacity={0.75} />
                {/* Ice-Silver Stitching */}
                <Circle
                  cx="100"
                  cy="100"
                  r="75.5"
                  stroke="#ffffff"
                  strokeOpacity={0.45}
                  strokeWidth="1.1"
                  strokeDasharray="3 3"
                  fill="none"
                />

                {/* 12-o'clock Leather Marker */}
                <Path d="M 93.5 16 L 106.5 16" stroke={accentColor} strokeWidth="18.5" />

                {/* Brushed Satin-Aluminum 4-Spoke Frame */}
                <Path d="M 23 88 L 69 81 L 69 115 L 23 109 Z" fill="url(#silverSpoke)" stroke="#d3cdc1" strokeWidth="1.2" />
                <Path d="M 177 88 L 131 81 L 131 115 L 177 109 Z" fill="url(#silverSpoke)" stroke="#d3cdc1" strokeWidth="1.2" />
                <Path d="M 80 123 L 68 176 L 86 181 L 95 129 Z" fill="url(#silverSpoke)" stroke="#d3cdc1" strokeWidth="1.1" />
                <Path d="M 120 123 L 132 176 L 114 181 L 105 129 Z" fill="url(#silverSpoke)" stroke="#d3cdc1" strokeWidth="1.1" />

                {/* Knurled Chrome Thumb Scroll Wheels on Spokes */}
                <Rect x="36" y="92" width="18" height="11" rx="3" fill="#ffffff" stroke="#2f6bff" strokeWidth="1.2" />
                <Line x1="45" y1="93" x2="45" y2="102" stroke="#2f6bff" strokeWidth="1.6" />
                <Rect x="146" y="92" width="18" height="11" rx="3" fill="#ffffff" stroke="#ff8a00" strokeWidth="1.2" />
                <Line x1="155" y1="93" x2="155" y2="102" stroke="#ff8a00" strokeWidth="1.6" />

                {/* Ceramic-Silver Center Hub Crest + 6 Stainless Hex Bolts */}
                <Path
                  d="M 68 75 Q 100 66 132 75 L 125 127 Q 100 137 75 127 Z"
                  fill="url(#ceramicHub)"
                  stroke="#94a3b8"
                  strokeWidth="1.8"
                />
                {[
                  [77, 81],
                  [123, 81],
                  [74, 102],
                  [126, 102],
                  [81, 121],
                  [119, 121],
                ].map(([bx, by], idx) => (
                  <Circle key={idx} cx={bx} cy={by} r="2.2" fill="#ffffff" stroke="#64748b" strokeWidth="1" />
                ))}

                <SvgText fontFamily="sans-serif" x="100" y="97" textAnchor="middle" fill="#0f172a" fontSize="10.5" fontWeight="900" letterSpacing="1.8">
                  {brandTitle}
                </SvgText>
                <SvgText fontFamily="sans-serif" x="100" y="111" textAnchor="middle" fill={accentColor} fontSize="8" fontWeight="800" letterSpacing="0.8">
                  {brandSub}
                </SvgText>

                {/* Machined Silver Suicide Spinner Knob */}
                <G transform="translate(157, 43)">
                  <Circle cx="0" cy="0" r="13.5" fill="#ffffff" stroke="#d3cdc1" strokeWidth="2" />
                  <Circle cx="0" cy="0" r="8" fill="#eef2f7" stroke="#2f6bff" strokeWidth="1.5" />
                  <Circle cx="-2" cy="-2" r="2.2" fill="#2f6bff" />
                </G>
              </Svg>
            </View>
          </View>
        </View>

        {/* Right Graduated Retarder Scale */}
        <View
          style={styles.retarderRail}
          onLayout={(e) => {
            retarderTrackHeight.current = e.nativeEvent.layout.height;
          }}
          onTouchStart={(e) => handleRetarderTouch(e.nativeEvent.locationY)}
          onTouchMove={(e) => handleRetarderTouch(e.nativeEvent.locationY)}
        >
          {[0, 1, 2, 3, 4, 5].map((lvl) => {
            const active = retarderLevel === lvl;
            const passed = retarderLevel >= lvl && lvl > 0;
            return (
              <Pressable
                key={lvl}
                onPress={() => {
                  CockpitHaptics.tick();
                  onRetarderChange(lvl);
                }}
                style={[
                  styles.retStep,
                  passed && styles.retStepPassed,
                  active && (lvl === 0 ? styles.retStepZeroActive : styles.retStepActive),
                ]}
              >
                <Text
                  style={[
                    styles.retTxt,
                    passed && { color: '#ff6a1a' },
                    active && { color: '#ffffff', fontWeight: '900' },
                  ]}
                >
                  {lvl === 0 ? 'R0' : `R${lvl}`}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Stalk Quick-Action Row */}
      <View style={styles.sideRail}>
        <Pressable
          onPress={() => {
            CockpitHaptics.switchClick();
            onToggleHighBeam();
          }}
          style={[styles.railBtn, highBeam && styles.railBtnBlue]}
        >
          <Text style={[styles.railTxt, highBeam && { color: '#ffffff' }]}>远光</Text>
        </Pressable>
        <Pressable
          onPressIn={() => {
            CockpitHaptics.tick();
            onFlashHighBeam(true);
          }}
          onPressOut={() => onFlashHighBeam(false)}
          style={styles.railBtn}
        >
          <Text style={[styles.railTxt, { color: '#2f6bff' }]}>闪灯</Text>
        </Pressable>
        <Pressable
          onPressIn={() => onHornChange(true, false)}
          onPressOut={() => onHornChange(false, false)}
          style={styles.railBtn}
        >
          <Text style={styles.railTxt}>电笛</Text>
        </Pressable>
        <Pressable
          onPressIn={() => onHornChange(true, true)}
          onPressOut={() => onHornChange(false, true)}
          style={[styles.railBtn, styles.railBtnAmber]}
        >
          <Text style={[styles.railTxt, { color: '#ff6a1a' }]}>气笛</Text>
        </Pressable>
      </View>

      {/* Bottom Daylight Cruise Control Pod */}
      <View style={styles.cruiseStrip}>
        <Pressable
          onPress={() => {
            CockpitHaptics.switchClick();
            onCruiseToggle();
          }}
          style={[styles.ccMainBtn, cruiseEnabled && { backgroundColor: accentColor, borderColor: accentColor }]}
        >
          <Text style={[styles.ccMainTxt, cruiseEnabled && { color: '#ffffff', fontWeight: '900' }]}>
            {cruiseEnabled ? `ACC ${cruiseSpeedKmh} KM/H` : 'ACC 智能巡航'}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => {
            CockpitHaptics.tick();
            onCruiseAdjust(-5);
          }}
          style={styles.ccStepBtn}
        >
          <Text style={styles.ccStepTxt}>-5</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            CockpitHaptics.tick();
            onCruiseAdjust(5);
          }}
          style={styles.ccStepBtn}
        >
          <Text style={styles.ccStepTxt}>+5</Text>
        </Pressable>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '28%',
    minWidth: 204,
    maxWidth: 280,
    paddingHorizontal: 8,
    paddingVertical: 8,
    justifyContent: 'space-between',
    gap: 7,
  },
  collarBar: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  signalPaddle: {
    flex: 1,
    minWidth: 52,
    paddingHorizontal: 4,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: CockpitTheme.shadowSoft,
  },
  signalPaddleActive: { backgroundColor: '#12b76a' },
  signalArrow: { fontSize: 10.5, fontWeight: '800', color: CockpitTheme.inkSoft },
  angleCenterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    backgroundColor: '#ffffff',
    paddingHorizontal: 7,
    paddingVertical: 7,
    borderRadius: 12,
    gap: 3,
    boxShadow: CockpitTheme.shadowSoft,
  },
  angleNum: {
    fontSize: 12,
    fontWeight: '800',
    color: CockpitTheme.ink,
    fontVariant: ['tabular-nums'],
    minWidth: 28,
    textAlign: 'right',
  },
  angleResetHint: { fontSize: 9, fontWeight: '700', color: CockpitTheme.muted },
  wheelStage: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  sideRail: { flexDirection: 'row', gap: 6 },
  railBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: CockpitTheme.shadowSoft,
  },
  railBtnBlue: { backgroundColor: '#2f6bff' },
  railBtnAmber: { backgroundColor: '#fff0e6' },
  railTxt: { fontSize: 10.5, fontWeight: '800', color: CockpitTheme.inkSoft },
  wheelTouchArea: { flex: 1, height: '100%', alignItems: 'center', justifyContent: 'center' },
  retarderRail: {
    width: 32,
    height: '94%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 3,
    justifyContent: 'space-between',
    gap: 3,
    boxShadow: CockpitTheme.shadowSoft,
  },
  retStep: {
    flex: 1,
    borderRadius: 11,
    backgroundColor: '#f3f1ec',
    alignItems: 'center',
    justifyContent: 'center',
  },
  retStepPassed: { backgroundColor: '#fff0e6' },
  retStepZeroActive: { backgroundColor: CockpitTheme.ink },
  retStepActive: { backgroundColor: '#ff6a1a' },
  retTxt: { fontSize: 9, fontWeight: '800', color: CockpitTheme.muted },
  cruiseStrip: { flexDirection: 'row', gap: 6 },
  ccMainBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    boxShadow: CockpitTheme.shadowSoft,
  },
  ccMainBtnOn: { backgroundColor: '#ff6a1a' },
  ccMainTxt: { fontSize: 10.5, fontWeight: '800', color: CockpitTheme.ink },
  ccStepBtn: {
    width: 40,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    boxShadow: CockpitTheme.shadowSoft,
  },
  ccStepTxt: { fontSize: 11, fontWeight: '800', color: CockpitTheme.ink },
});
