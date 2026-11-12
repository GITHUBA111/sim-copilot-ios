import React, { useRef, useState } from 'react';
import { LayoutChangeEvent, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { CockpitTheme } from '../theme/cockpitTheme';
import { FS25_TOOL_SLOTS, Fs25LoaderAxisMode } from '../types/fs25State';
import { CockpitHaptics } from '../utils/haptics';

interface HydraulicJoystickPodProps {
  loaderX: number;
  loaderY: number;
  loaderAux: boolean;
  loaderMode: Fs25LoaderAxisMode;
  simBoomHeight: number;
  simBucketTilt: number;
  activeToolSlot: number;
  onLoaderMove: (x: number, y: number) => void;
  onToggleAux: () => void;
  onToggleMode: () => void;
  onSwitchTool: () => void;
  onAttachTool: () => void;
}

const AGRI_GREEN = '#15803d';
const AGRI_AMBER = '#d97706';

export const HydraulicJoystickPod: React.FC<HydraulicJoystickPodProps> = React.memo(
  ({
    loaderX,
    loaderY,
    loaderAux,
    loaderMode,
    simBoomHeight,
    simBucketTilt,
    activeToolSlot,
    onLoaderMove,
    onToggleAux,
    onToggleMode,
    onSwitchTool,
    onAttachTool,
  }) => {
    const padRef = useRef<React.ComponentRef<typeof View>>(null);
    const boundsRef = useRef({ left: 0, top: 0, width: 160, height: 160 });
    const [padSize, setPadSize] = useState({ w: 164, h: 164 });
    const activePtrRef = useRef<number | string | null>(null);
    const prevZoneRef = useRef<string>('C');

    const refreshBounds = () => {
      padRef.current?.measureInWindow((x, y, w, h) => {
        if (w > 30 && h > 30) {
          boundsRef.current = { left: x, top: y, width: w, height: h };
        }
      });
    };

    const handlePadLayout = (e: LayoutChangeEvent) => {
      const { width, height } = e.nativeEvent.layout;
      if (width > 30 && height > 30) {
        setPadSize({ w: width, h: height });
        setTimeout(refreshBounds, 25);
      }
    };

    const updateFromPagePoint = (pageX: number, pageY: number, locX?: number, locY?: number) => {
      const b = boundsRef.current;
      let nx = 0;
      let ny = 0;
      if (b.width > 30 && b.left > 0) {
        const cx = b.left + b.width / 2;
        const cy = b.top + b.height / 2;
        const maxR = Math.min(b.width, b.height) * 0.42;
        nx = Math.max(-1, Math.min(1, (pageX - cx) / maxR));
        ny = Math.max(-1, Math.min(1, -(pageY - cy) / maxR)); // Up on screen => +1 (push forward)
      } else {
        const cx = padSize.w / 2;
        const cy = padSize.h / 2;
        const maxR = Math.min(padSize.w, padSize.h) * 0.42;
        nx = Math.max(-1, Math.min(1, ((locX ?? cx) - cx) / maxR));
        ny = Math.max(-1, Math.min(1, -( (locY ?? cy) - cy) / maxR));
      }

      // Subtle hydraulic valve click when crossing the 0.22 deadzone gate
      const zone =
        (ny > 0.22 ? 'U' : ny < -0.22 ? 'D' : '') +
        (nx < -0.22 ? 'L' : nx > 0.22 ? 'R' : '') || 'C';
      if (zone !== prevZoneRef.current) {
        prevZoneRef.current = zone;
        CockpitHaptics.tick();
      }
      onLoaderMove(nx, ny);
    };

    const releaseStick = () => {
      activePtrRef.current = null;
      if (prevZoneRef.current !== 'C') {
        prevZoneRef.current = 'C';
        CockpitHaptics.tick();
      }
      onLoaderMove(0, 0);
    };

    const webStickProps =
      Platform.OS === 'web'
        ? {
            onPointerDown: (e: any) => {
              refreshBounds();
              activePtrRef.current = e.pointerId ?? 'm';
              try {
                e.currentTarget?.setPointerCapture?.(e.pointerId);
              } catch {}
              updateFromPagePoint(e.pageX, e.pageY);
            },
            onPointerMove: (e: any) => {
              if (activePtrRef.current === null) return;
              updateFromPagePoint(e.pageX, e.pageY);
            },
            onPointerUp: releaseStick,
            onPointerCancel: releaseStick,
          }
        : {};

    const cx = padSize.w / 2;
    const cy = padSize.h / 2;
    const travel = Math.min(padSize.w, padSize.h) * 0.34;
    const knobX = cx + loaderX * travel;
    const knobY = cy - loaderY * travel;
    const activeColor = loaderAux ? AGRI_AMBER : AGRI_GREEN;

    const topLbl = loaderAux ? '▲ 伸出臂 [S+N]' : '▲ 降大臂 [N]';
    const botLbl = loaderAux ? '▼ 缩回臂 [S+J]' : '▼ 升大臂 [J]';
    const leftLbl = loaderAux ? '合爪' : '收铲';
    const rightLbl = loaderAux ? '张爪' : '翻斗';

    // Mini animated loader arm geometry
    const boomDeg = -10 - (simBoomHeight / 100) * 42;
    const boomRad = (boomDeg * Math.PI) / 180;
    const px1 = 16;
    const py1 = 22;
    const px2 = px1 + Math.cos(boomRad) * 26;
    const py2 = py1 + Math.sin(boomRad) * 26;

    return (
      <View style={styles.container}>
        {/* Top Circuit & Mode Selector */}
        <View style={styles.topHeader}>
          <Pressable
            onPress={() => {
              CockpitHaptics.switchClick();
              onToggleAux();
            }}
            style={[
              styles.circuitBtn,
              { backgroundColor: loaderAux ? AGRI_AMBER : AGRI_GREEN },
            ]}
          >
            <Text style={styles.circuitBtnTxt}>
              {loaderAux ? '2路·伸缩/抓木爪' : '1路·前铲大臂'}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => {
              CockpitHaptics.tick();
              onToggleMode();
            }}
            style={[styles.modeChip, loaderMode === 'analog' && styles.modeChipAnalog]}
          >
            <Text style={[styles.modeChipTxt, loaderMode === 'analog' && { color: '#ffffff' }]}>
              {loaderMode === 'keys' ? '免设键' : '线性轴'}
            </Text>
          </Pressable>
        </View>

        {/* 2D Spring-Centered Hydraulic Cross-Gate Pad */}
        <View
          ref={padRef}
          onLayout={handlePadLayout}
          style={styles.stickWell}
          onStartShouldSetResponder={() => Platform.OS !== 'web'}
          onMoveShouldSetResponder={() => Platform.OS !== 'web'}
          onResponderGrant={(e) => {
            refreshBounds();
            updateFromPagePoint(
              e.nativeEvent.pageX,
              e.nativeEvent.pageY,
              e.nativeEvent.locationX,
              e.nativeEvent.locationY
            );
          }}
          onResponderMove={(e) => {
            updateFromPagePoint(
              e.nativeEvent.pageX,
              e.nativeEvent.pageY,
              e.nativeEvent.locationX,
              e.nativeEvent.locationY
            );
          }}
          onResponderRelease={releaseStick}
          onResponderTerminate={releaseStick}
          {...(webStickProps as object)}
        >
          <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            <Svg width={padSize.w} height={padSize.h}>
              {/* Outer Ring & Crosshair Gate */}
              <Circle
                cx={cx}
                cy={cy}
                r={travel + 12}
                stroke="#e2ddd3"
                strokeWidth={1.6}
                strokeDasharray="4 3"
                fill="#faf8f5"
              />
              <Line
                x1={cx}
                y1={cy - travel - 8}
                x2={cx}
                y2={cy + travel + 8}
                stroke="#ded9ce"
                strokeWidth={5}
                strokeLinecap="round"
              />
              <Line
                x1={cx - travel - 8}
                y1={cy}
                x2={cx + travel + 8}
                y2={cy}
                stroke="#ded9ce"
                strokeWidth={5}
                strokeLinecap="round"
              />
              {/* Active Hydraulic Stem */}
              <Line
                x1={cx}
                y1={cy}
                x2={knobX}
                y2={knobY}
                stroke={activeColor}
                strokeWidth={7}
                strokeLinecap="round"
              />
              <Circle cx={cx} cy={cy} r={5} fill="#94a3b8" />
              {/* Ergonomic CommandPRO Grip Puck */}
              <Circle cx={knobX} cy={knobY} r={22} fill={activeColor} />
              <Circle cx={knobX} cy={knobY} r={15} fill="rgba(255,255,255,0.22)" />
              <Circle cx={knobX} cy={knobY} r={4.5} fill="#ffffff" />
            </Svg>
          </View>

          <Text pointerEvents="none" style={[styles.axisHintTop, loaderY > 0.22 && { color: activeColor }]}>
            {topLbl}
          </Text>
          <Text pointerEvents="none" style={[styles.axisHintBot, loaderY < -0.22 && { color: activeColor }]}>
            {botLbl}
          </Text>
          <Text pointerEvents="none" style={[styles.axisHintLeft, loaderX < -0.22 && { color: activeColor }]}>
            {leftLbl}
          </Text>
          <Text pointerEvents="none" style={[styles.axisHintRight, loaderX > 0.22 && { color: activeColor }]}>
            {rightLbl}
          </Text>
        </View>

        {/* Live Hydraulic Boom & Bucket Telemetry Strip */}
        <View style={styles.hydReadoutBar}>
          <Svg width={52} height={26} viewBox="0 0 52 26">
            <Rect x={3} y={16} width={14} height={8} rx={2} fill={CockpitTheme.ink} />
            <Line x1={px1} y1={py1} x2={px2} y2={py2} stroke={activeColor} strokeWidth={3} strokeLinecap="round" />
            <Path
              d={`M ${px2} ${py2} l 7 -3 l 2 7 l -8 1 Z`}
              fill={AGRI_AMBER}
            />
          </Svg>
          <View style={styles.hydTextCol}>
            <Text style={styles.hydTxt}>臂高 {Math.round(simBoomHeight)}%</Text>
            <Text style={styles.hydSubTxt}>
              铲角 {simBucketTilt >= 0 ? `+${Math.round(simBucketTilt)}°` : `${Math.round(simBucketTilt)}°`}
            </Text>
          </View>
        </View>

        {/* Joystick Grip Thumb Buttons: Switch Tool [G] & Attach/Detach [Q] */}
        <View style={styles.gripBtnRow}>
          <Pressable
            onPress={() => {
              CockpitHaptics.switchClick();
              onSwitchTool();
            }}
            style={({ pressed }) => [styles.gripBtn, pressed && { transform: [{ scale: 0.95 }] }]}
          >
            <Text style={styles.gripKeyBadge}>[G]</Text>
            <Text style={styles.gripBtnTitle}>切农具</Text>
            <Text style={styles.gripBtnSub}>{FS25_TOOL_SLOTS[activeToolSlot]}</Text>
          </Pressable>

          <Pressable
            onPress={() => {
              CockpitHaptics.heavyClunk();
              onAttachTool();
            }}
            style={({ pressed }) => [
              styles.gripBtn,
              styles.gripBtnAmber,
              pressed && { transform: [{ scale: 0.95 }] },
            ]}
          >
            <Text style={[styles.gripKeyBadge, { color: AGRI_AMBER }]}>[Q]</Text>
            <Text style={[styles.gripBtnTitle, { color: '#92400e' }]}>挂/脱钩</Text>
            <Text style={[styles.gripBtnSub, { color: AGRI_AMBER }]}>三点悬挂</Text>
          </Pressable>
        </View>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    width: 196,
    paddingHorizontal: 8,
    paddingVertical: 8,
    justifyContent: 'space-between',
    gap: 6,
    backgroundColor: CockpitTheme.dashSurface,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  circuitBtn: {
    flex: 1,
    height: 28,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  circuitBtnTxt: {
    fontSize: 10,
    fontWeight: '800',
    color: '#ffffff',
  },
  modeChip: {
    height: 28,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: CockpitTheme.shadowSoft,
  },
  modeChipAnalog: {
    backgroundColor: '#2f6bff',
  },
  modeChipTxt: {
    fontSize: 9.5,
    fontWeight: '800',
    color: CockpitTheme.inkSoft,
  },
  stickWell: {
    flex: 1,
    minHeight: 146,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    boxShadow: CockpitTheme.shadowLift,
  },
  axisHintTop: {
    position: 'absolute',
    top: 6,
    fontSize: 9,
    fontWeight: '800',
    color: CockpitTheme.muted,
  },
  axisHintBot: {
    position: 'absolute',
    bottom: 6,
    fontSize: 9,
    fontWeight: '800',
    color: CockpitTheme.muted,
  },
  axisHintLeft: {
    position: 'absolute',
    left: 6,
    fontSize: 9,
    fontWeight: '800',
    color: CockpitTheme.muted,
  },
  axisHintRight: {
    position: 'absolute',
    right: 6,
    fontSize: 9,
    fontWeight: '800',
    color: CockpitTheme.muted,
  },
  hydReadoutBar: {
    height: 34,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    boxShadow: CockpitTheme.shadowSoft,
  },
  hydTextCol: {
    alignItems: 'flex-end',
  },
  hydTxt: {
    fontSize: 9.5,
    fontWeight: '800',
    color: CockpitTheme.ink,
    fontVariant: ['tabular-nums'],
  },
  hydSubTxt: {
    fontSize: 8.5,
    fontWeight: '700',
    color: CockpitTheme.muted,
    fontVariant: ['tabular-nums'],
  },
  gripBtnRow: {
    flexDirection: 'row',
    gap: 6,
    height: 54,
  },
  gripBtn: {
    flex: 1,
    borderRadius: 13,
    backgroundColor: '#ffffff',
    paddingHorizontal: 6,
    paddingVertical: 5,
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: CockpitTheme.shadowSoft,
  },
  gripBtnAmber: {
    backgroundColor: '#fffbeb',
  },
  gripKeyBadge: {
    fontSize: 8.5,
    fontWeight: '800',
    color: CockpitTheme.muted,
  },
  gripBtnTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: CockpitTheme.ink,
  },
  gripBtnSub: {
    fontSize: 8.5,
    fontWeight: '700',
    color: AGRI_GREEN,
  },
});
