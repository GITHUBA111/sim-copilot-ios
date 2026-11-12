import React, { useRef } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CockpitTheme } from '../theme/cockpitTheme';
import { DriveSelector } from '../types/truckState';
import { CockpitHaptics } from '../utils/haptics';

interface PedalShifterZoneProps {
  driveSelector: DriveSelector;
  gearDisplay: string;
  manualSequential: boolean;
  throttle: number;
  throttleLocked: boolean;
  brake: number;
  parkingBrake: boolean;
  onSelectDrive: (d: DriveSelector) => void;
  onShiftStep: (delta: 1 | -1) => void;
  onThrottleChange: (val: number) => void;
  onToggleThrottleLock: () => void;
  onBrakeChange: (val: number) => void;
  onToggleParkingBrake: () => void;
}

export const PedalShifterZone: React.FC<PedalShifterZoneProps> = React.memo(
  ({
    driveSelector,
    gearDisplay,
    throttle,
    throttleLocked,
    brake,
    parkingBrake,
    onSelectDrive,
    onShiftStep,
    onThrottleChange,
    onToggleThrottleLock,
    onBrakeChange,
    onToggleParkingBrake,
  }) => {
    const brakeTrackRef = useRef<React.ComponentRef<typeof View>>(null);
    const throttleTrackRef = useRef<React.ComponentRef<typeof View>>(null);

    const brakeBoundsRef = useRef({ top: 0, height: 180 });
    const throttleBoundsRef = useRef({ top: 0, height: 180 });

    const brakeTouchId = useRef<number | string | null>(null);
    const throttleTouchId = useRef<number | string | null>(null);
    const throttleLockedRef = useRef(throttleLocked);
    throttleLockedRef.current = throttleLocked;

    const refreshPedalBounds = () => {
      brakeTrackRef.current?.measureInWindow((_x, y, _w, h) => {
        if (h > 20) brakeBoundsRef.current = { top: y, height: h };
      });
      throttleTrackRef.current?.measureInWindow((_x, y, _w, h) => {
        if (h > 20) throttleBoundsRef.current = { top: y, height: h };
      });
    };

    const calcRatioFromPageY = (
      pageY: number,
      bounds: { top: number; height: number },
      fallbackLocY?: number
    ) => {
      if (bounds.height > 20 && bounds.top > 0) {
        const relY = pageY - bounds.top;
        return Math.max(0, Math.min(1, 1 - relY / bounds.height));
      }
      const h = bounds.height || 180;
      return Math.max(0, Math.min(1, 1 - (fallbackLocY ?? h) / h));
    };

    const webBrakeProps =
      Platform.OS === 'web'
        ? {
            onPointerDown: (e: any) => {
              refreshPedalBounds();
              brakeTouchId.current = e.pointerId ?? 'm';
              e.currentTarget?.setPointerCapture?.(e.pointerId);
              onBrakeChange(calcRatioFromPageY(e.pageY, brakeBoundsRef.current));
            },
            onPointerMove: (e: any) => {
              if (brakeTouchId.current === null) return;
              onBrakeChange(calcRatioFromPageY(e.pageY, brakeBoundsRef.current));
            },
            onPointerUp: () => {
              brakeTouchId.current = null;
              onBrakeChange(0);
            },
          }
        : {};

    const webThrottleProps =
      Platform.OS === 'web'
        ? {
            onPointerDown: (e: any) => {
              refreshPedalBounds();
              throttleTouchId.current = e.pointerId ?? 'm';
              e.currentTarget?.setPointerCapture?.(e.pointerId);
              onThrottleChange(calcRatioFromPageY(e.pageY, throttleBoundsRef.current));
            },
            onPointerMove: (e: any) => {
              if (throttleTouchId.current === null) return;
              onThrottleChange(calcRatioFromPageY(e.pageY, throttleBoundsRef.current));
            },
            onPointerUp: () => {
              throttleTouchId.current = null;
              if (!throttleLockedRef.current) onThrottleChange(0);
            },
          }
        : {};

    return (
      <LinearGradient colors={['#f3f1ec', '#f3f1ec']} style={styles.container}>
        {/* Daylight Brushed-Silver Opticruise Selector Pod */}
        <View style={styles.shifterPod}>
          <View style={styles.rndRow}>
            {(['D', 'N', 'R'] as DriveSelector[]).map((g) => {
              const active = driveSelector === g;
              const activeBg =
                g === 'R' ? '#f04438' : g === 'D' ? '#12b76a' : '#161c2a';
              return (
                <Pressable
                  key={g}
                  onPress={() => {
                    if (g === 'R') CockpitHaptics.warningPulse();
                    else CockpitHaptics.heavyClunk();
                    onSelectDrive(g);
                  }}
                  style={[styles.rndBtn, active && { backgroundColor: activeBg, borderColor: activeBg }]}
                >
                  <Text style={[styles.rndText, active && { color: '#ffffff' }]}>{g}</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.seqRow}>
            <Pressable
              onPress={() => {
                CockpitHaptics.switchClick();
                onShiftStep(-1);
              }}
              style={styles.seqBtn}
            >
              <Text style={styles.seqTxt}>-</Text>
            </Pressable>
            <View style={styles.gearDisplayPill}>
              <Text style={styles.gearDisplayTxt}>{gearDisplay}</Text>
            </View>
            <Pressable
              onPress={() => {
                CockpitHaptics.switchClick();
                onShiftStep(1);
              }}
              style={styles.seqBtn}
            >
              <Text style={styles.seqTxt}>+</Text>
            </Pressable>
          </View>
        </View>

        {/* Graduated Manometer Pedal Wells + CNC Brushed Metal Pedals */}
        <View style={styles.pedalsArea}>
          {/* BRAKE */}
          <View style={styles.pedalCol}>
            <View style={styles.pedalMeta}>
              <Text style={styles.pedalTitle}>制动</Text>
              <Text style={[styles.pedalPct, brake > 0.02 && { color: '#f04438' }]}>
                {Math.round(brake * 100)}%
              </Text>
            </View>

            <View
              ref={brakeTrackRef}
              onLayout={(e) => {
                brakeBoundsRef.current.height = e.nativeEvent.layout.height;
                setTimeout(refreshPedalBounds, 30);
              }}
              style={styles.pedalSlot}
              onTouchStart={(e) => {
                if (brakeTouchId.current !== null) return;
                const t = e.nativeEvent.changedTouches[0];
                if (!t) return;
                refreshPedalBounds();
                brakeTouchId.current = t.identifier;
                CockpitHaptics.tick();
                onBrakeChange(calcRatioFromPageY(t.pageY, brakeBoundsRef.current, t.locationY));
              }}
              onTouchMove={(e) => {
                if (brakeTouchId.current === null) return;
                const touches = e.nativeEvent.changedTouches;
                for (let i = 0; i < touches.length; i++) {
                  const t = touches[i];
                  if (t.identifier === brakeTouchId.current) {
                    onBrakeChange(calcRatioFromPageY(t.pageY, brakeBoundsRef.current, t.locationY));
                    break;
                  }
                }
              }}
              onTouchEnd={(e) => {
                const touches = e.nativeEvent.changedTouches;
                for (let i = 0; i < touches.length; i++) {
                  if (touches[i].identifier === brakeTouchId.current) {
                    brakeTouchId.current = null;
                    onBrakeChange(0);
                    break;
                  }
                }
              }}
              onTouchCancel={() => {
                brakeTouchId.current = null;
                onBrakeChange(0);
              }}
              {...webBrakeProps}
            >
              {/* Twin Satin Chrome Hydraulic Guide Rods */}
              <View pointerEvents="none" style={styles.guideRods}>
                <View style={styles.chromeRod} />
                <View style={styles.chromeRod} />
              </View>

              {/* Instrument Scale Ticks */}
              <View pointerEvents="none" style={styles.gaugeTicksCol}>
                {[0, 1, 2, 3, 4].map((t) => (
                  <View key={t} style={styles.gaugeTickLine} />
                ))}
              </View>

              {/* Daylight Crimson Pressure Ribbon */}
              <View pointerEvents="none" style={[styles.fillBar, styles.brakeFill, { height: `${brake * 100}%` }]} />

              {/* Ribbed Slate Brake Plate */}
              <LinearGradient
                pointerEvents="none"
                colors={['#3a4258', '#252d44', '#161c2a']}
                style={[styles.pedalPad, { bottom: `${Math.min(82, brake * 82)}%` }]}
              >
                <View style={styles.rubberGroove} />
                <View style={styles.rubberGroove} />
                <View style={styles.rubberGroove} />
              </LinearGradient>
            </View>

            <Pressable
              onPress={() => {
                CockpitHaptics.airBrakeValve();
                onToggleParkingBrake();
              }}
              style={[styles.latchBtn, parkingBrake && styles.parkLatchOn]}
            >
              <Text style={[styles.latchTxt, parkingBrake && { color: '#ffffff' }]}>
                {parkingBrake ? '(P)驻车' : '(P)释放'}
              </Text>
            </Pressable>
          </View>

          {/* THROTTLE */}
          <View style={styles.pedalCol}>
            <View style={styles.pedalMeta}>
              <Text style={styles.pedalTitle}>油门</Text>
              <Text style={[styles.pedalPct, throttle > 0.02 && { color: '#12b76a' }]}>
                {Math.round(throttle * 100)}%
              </Text>
            </View>

            <View
              ref={throttleTrackRef}
              onLayout={(e) => {
                throttleBoundsRef.current.height = e.nativeEvent.layout.height;
                setTimeout(refreshPedalBounds, 30);
              }}
              style={styles.pedalSlot}
              onTouchStart={(e) => {
                if (throttleTouchId.current !== null) return;
                const t = e.nativeEvent.changedTouches[0];
                if (!t) return;
                refreshPedalBounds();
                throttleTouchId.current = t.identifier;
                CockpitHaptics.tick();
                onThrottleChange(calcRatioFromPageY(t.pageY, throttleBoundsRef.current, t.locationY));
              }}
              onTouchMove={(e) => {
                if (throttleTouchId.current === null) return;
                const touches = e.nativeEvent.changedTouches;
                for (let i = 0; i < touches.length; i++) {
                  const t = touches[i];
                  if (t.identifier === throttleTouchId.current) {
                    onThrottleChange(calcRatioFromPageY(t.pageY, throttleBoundsRef.current, t.locationY));
                    break;
                  }
                }
              }}
              onTouchEnd={(e) => {
                const touches = e.nativeEvent.changedTouches;
                for (let i = 0; i < touches.length; i++) {
                  if (touches[i].identifier === throttleTouchId.current) {
                    throttleTouchId.current = null;
                    if (!throttleLockedRef.current) onThrottleChange(0);
                    break;
                  }
                }
              }}
              onTouchCancel={() => {
                throttleTouchId.current = null;
                if (!throttleLockedRef.current) onThrottleChange(0);
              }}
              {...webThrottleProps}
            >
              <View pointerEvents="none" style={styles.guideRods}>
                <View style={styles.chromeRod} />
                <View style={styles.chromeRod} />
              </View>

              <View pointerEvents="none" style={styles.gaugeTicksCol}>
                {[0, 1, 2, 3, 4].map((t) => (
                  <View key={t} style={styles.gaugeTickLine} />
                ))}
              </View>

              <View pointerEvents="none" style={[styles.fillBar, styles.throttleFill, { height: `${throttle * 100}%` }]} />

              {/* CNC Drilled Brushed Silver-Aluminum Accelerator Plate */}
              <LinearGradient
                pointerEvents="none"
                colors={['#ff8a4d', '#ff6a1a', '#f05a0a']}
                style={[styles.pedalPad, styles.throttlePad, { bottom: `${Math.min(80, throttle * 80)}%` }]}
              >
                <View style={styles.drilledRow}>
                  <View style={styles.drilledHole} />
                  <View style={styles.drilledHole} />
                  <View style={styles.drilledHole} />
                </View>
                <View style={styles.drilledRow}>
                  <View style={styles.drilledHole} />
                  <View style={styles.drilledHole} />
                  <View style={styles.drilledHole} />
                </View>
              </LinearGradient>
            </View>

            <Pressable
              onPress={() => {
                CockpitHaptics.switchClick();
                onToggleThrottleLock();
              }}
              style={[styles.latchBtn, throttleLocked && styles.holdLatchOn]}
            >
              <Text style={[styles.latchTxt, throttleLocked && { color: '#ffffff', fontWeight: '900' }]}>
                {throttleLocked ? '已锁止' : '锁油门'}
              </Text>
            </Pressable>
          </View>
        </View>
      </LinearGradient>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    width: '19.5%',
    minWidth: 142,
    maxWidth: 186,
    paddingHorizontal: 8,
    paddingVertical: 8,
    justifyContent: 'space-between',
    gap: 8,
  },
  shifterPod: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 5,
    gap: 5,
    boxShadow: CockpitTheme.shadowSoft,
  },
  rndRow: { flexDirection: 'row', gap: 4 },
  rndBtn: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#f3f1ec',
    alignItems: 'center',
  },
  rndText: { fontSize: 13, fontWeight: '800', color: CockpitTheme.inkSoft },
  seqRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  seqBtn: {
    width: 30,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: '#f3f1ec',
    alignItems: 'center',
  },
  seqTxt: { fontSize: 14, fontWeight: '800', color: CockpitTheme.ink },
  gearDisplayPill: { flex: 1, paddingVertical: 5, alignItems: 'center' },
  gearDisplayTxt: { fontSize: 13, fontWeight: '800', color: CockpitTheme.ink, fontVariant: ['tabular-nums'] },
  pedalsArea: { flex: 1, flexDirection: 'row', gap: 8 },
  pedalCol: { flex: 1, justifyContent: 'space-between', gap: 5 },
  pedalMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 2 },
  pedalTitle: { fontSize: 10, fontWeight: '800', color: CockpitTheme.inkSoft },
  pedalPct: { fontSize: 10, fontWeight: '800', color: CockpitTheme.muted, fontVariant: ['tabular-nums'] },
  pedalSlot: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    boxShadow: CockpitTheme.shadowSoft,
  },
  guideRods: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  chromeRod: { width: 4, height: '100%', backgroundColor: '#f1eee8', borderRadius: 2 },
  gaugeTicksCol: {
    position: 'absolute',
    top: 14,
    bottom: 14,
    right: 5,
    justifyContent: 'space-between',
  },
  gaugeTickLine: { width: 6, height: 2, borderRadius: 1, backgroundColor: '#e3dfd6' },
  fillBar: { width: '100%' },
  brakeFill: { backgroundColor: 'rgba(240, 68, 56, 0.14)' },
  throttleFill: { backgroundColor: 'rgba(255, 106, 26, 0.14)' },
  pedalPad: {
    position: 'absolute',
    left: 6,
    right: 6,
    height: 34,
    borderRadius: 12,
    justifyContent: 'space-evenly',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  throttlePad: { height: 40 },
  rubberGroove: { height: 2.5, backgroundColor: 'rgba(255,255,255,0.28)', borderRadius: 2 },
  drilledRow: { flexDirection: 'row', justifyContent: 'space-evenly' },
  drilledHole: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: 'rgba(255,255,255,0.6)' },
  latchBtn: {
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    boxShadow: CockpitTheme.shadowSoft,
  },
  parkLatchOn: { backgroundColor: '#f04438' },
  holdLatchOn: { backgroundColor: '#12b76a' },
  latchTxt: { fontSize: 10, fontWeight: '800', color: CockpitTheme.ink },
});
