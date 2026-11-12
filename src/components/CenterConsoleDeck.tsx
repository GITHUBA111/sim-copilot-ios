import React, { useRef, useState } from 'react';
import {
  LayoutChangeEvent,
  Platform,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Svg, { Circle, Line, Rect, Text as SvgText } from 'react-native-svg';
import { CockpitTheme } from '../theme/cockpitTheme';
import {
  SteeringLockRange,
  TruckControllerState,
  WiperMode,
} from '../types/truckState';
import { CockpitHaptics } from '../utils/haptics';
import { RockerSwitch } from './RockerSwitch';

interface CenterConsoleDeckProps {
  state: TruckControllerState;
  activeBay: number;
  onBayChange: (bayIndex: number) => void;
  onPatch: (patch: Partial<TruckControllerState>, tag?: string) => void;
  onMomentaryCommand: (tag: string) => void;
  onConnectPc: () => void;
  onAutoDiscoverPc: () => void;
  scanningPc?: boolean;
}

const BAY_TABS = [
  { idx: 0, short: '1·主驾总控', code: 'MAIN' },
  { idx: 1, short: '2·底盘气囊', code: 'CHASSIS' },
  { idx: 2, short: '3·变速智驾', code: 'GEAR' },
  { idx: 3, short: '4·视角连接', code: 'VIEW' },
];

const WIPER_LABELS = ['关', '间歇', '低速', '高速'] as const;

export const CenterConsoleDeck: React.FC<CenterConsoleDeckProps> = React.memo(
  ({ state, activeBay, onBayChange, onPatch, onMomentaryCommand, onConnectPc, onAutoDiscoverPc, scanningPc }) => {
    const scrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
    const [deckWidth, setDeckWidth] = useState(380);
    const [deckScrollEnabled, setDeckScrollEnabled] = useState(true);
    const freelookWidthRef = useRef(220);

    const handleDeckLayout = (e: LayoutChangeEvent) => {
      const w = Math.floor(e.nativeEvent.layout.width);
      if (w > 80 && Math.abs(w - deckWidth) > 1) {
        setDeckWidth(w);
        setTimeout(() => {
          scrollRef.current?.scrollTo({ x: activeBay * w, animated: false });
        }, 20);
      }
    };


    // Desktop/web: mouse-drag swipe between bays (touch devices already swipe natively)
    const dragRef = useRef({ down: false, moved: false, startX: 0, startScroll: 0, lastX: 0, lastT: 0, vx: 0 });
    const scrollXRef = useRef(0);

    const viewportRef = useRef<any>(null);
    const deckWidthRef = useRef(deckWidth);
    deckWidthRef.current = deckWidth;
    const activeBayRef = useRef(activeBay);
    activeBayRef.current = activeBay;
    const onBayChangeRef = useRef(onBayChange);
    onBayChangeRef.current = onBayChange;

    React.useEffect(() => {
      if (Platform.OS !== 'web') return;
      const el: HTMLElement | null = viewportRef.current;
      if (!el || !el.addEventListener) return;
      const d = dragRef.current;
      const maxPage = BAY_TABS.length - 1;

      const down = (e: PointerEvent) => {
        if (e.pointerType === 'touch') return;
        if ((e.target as HTMLElement)?.closest?.('[data-noswipe="1"]')) return;
        d.down = true;
        d.moved = false;
        d.startX = e.clientX;
        d.startScroll = scrollXRef.current;
        d.lastX = e.clientX;
        d.lastT = Date.now();
        d.vx = 0;
      };
      const move = (e: PointerEvent) => {
        if (!d.down) return;
        const dx = e.clientX - d.startX;
        if (!d.moved && Math.abs(dx) > 8) {
          d.moved = true;
          try { el.setPointerCapture(e.pointerId); } catch {}
        }
        if (d.moved) {
          const now = Date.now();
          d.vx = (d.lastX - e.clientX) / Math.max(1, now - d.lastT);
          d.lastX = e.clientX;
          d.lastT = now;
          const w = deckWidthRef.current;
          const x = Math.max(0, Math.min(maxPage * w, d.startScroll - dx));
          scrollRef.current?.scrollTo({ x, animated: false });
        }
      };
      const up = (e: PointerEvent) => {
        if (!d.down) return;
        d.down = false;
        if (d.moved) {
          const w = deckWidthRef.current;
          const raw = d.startScroll - (e.clientX - d.startX) + d.vx * 120;
          const page = Math.max(0, Math.min(maxPage, Math.round(raw / w)));
          scrollRef.current?.scrollTo({ x: page * w, animated: true });
          if (page !== activeBayRef.current) {
            CockpitHaptics.tick();
            onBayChangeRef.current(page);
          }
        }
      };
      const swallowClick = (e: Event) => {
        if (d.moved) {
          e.stopPropagation();
          e.preventDefault();
          d.moved = false;
        }
      };
      el.addEventListener('pointerdown', down);
      el.addEventListener('pointermove', move);
      el.addEventListener('pointerup', up);
      el.addEventListener('pointercancel', up);
      el.addEventListener('click', swallowClick, true);
      return () => {
        el.removeEventListener('pointerdown', down);
        el.removeEventListener('pointermove', move);
        el.removeEventListener('pointerup', up);
        el.removeEventListener('pointercancel', up);
        el.removeEventListener('click', swallowClick, true);
      };
    }, []);

    const jumpToBay = (idx: number) => {
      const clamped = Math.max(0, Math.min(BAY_TABS.length - 1, idx));
      CockpitHaptics.tick();
      onBayChange(clamped);
      scrollRef.current?.scrollTo({ x: clamped * deckWidth, animated: true });
    };

    React.useEffect(() => {
      if (deckWidth > 80) {
        const clamped = Math.max(0, Math.min(BAY_TABS.length - 1, activeBay));
        scrollRef.current?.scrollTo({ x: clamped * deckWidth, animated: true });
      }
    }, [activeBay, deckWidth]);

    const handleScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (deckWidth <= 0) return;
      const page = Math.round(e.nativeEvent.contentOffset.x / deckWidth);
      if (page !== activeBay && page >= 0 && page < BAY_TABS.length) {
        CockpitHaptics.tick();
        onBayChange(page);
      }
    };

    const cycleWiper = () => {
      const next = ((state.wiperMode + 1) % 4) as WiperMode;
      onPatch({ wiperMode: next }, `WIPERS [P] · 雨刷档位: ${WIPER_LABELS[next]}`);
    };

    return (
      <View style={styles.wrapper}>
        <View ref={viewportRef} style={styles.deckViewport} onLayout={handleDeckLayout}>
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            scrollEnabled={deckScrollEnabled}
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleScrollEnd}
            onScroll={(e) => {
              scrollXRef.current = e.nativeEvent.contentOffset.x;
            }}
            scrollEventThrottle={16}
            decelerationRate="fast"
            keyboardShouldPersistTaps="handled"
          >
            {/* ======== BAY 1: HIGH-DENSITY 5×3 MAIN DRIVING MATRIX (15 UNIFORM KEYS) ======== */}
            <View style={[styles.bayPage, { width: deckWidth }]}>
              <View style={styles.gridRow}>
                <RockerSwitch
                  label="示宽灯"
                  subLabel="L1"
                  icon="parkingLight"
                  ledColor="green"
                  active={state.headlightMode >= 1}
                  onPress={() =>
                    onPatch(
                      { headlightMode: state.headlightMode === 1 ? 0 : 1 },
                      state.headlightMode === 1 ? 'LIGHTS · 关闭车灯' : 'PARKING LIGHT · 示宽轮廓灯'
                    )
                  }
                />
                <RockerSwitch
                  label="近光灯"
                  subLabel="[L]"
                  icon="lowBeam"
                  ledColor="green"
                  active={state.headlightMode === 2}
                  onPress={() =>
                    onPatch(
                      { headlightMode: state.headlightMode === 2 ? 1 : 2 },
                      state.headlightMode === 2 ? 'LOW BEAM OFF · 退回示宽灯' : 'LOW BEAM · 近光主大灯开启'
                    )
                  }
                />
                <RockerSwitch
                  label="远光灯"
                  subLabel="[K]"
                  icon="highBeam"
                  ledColor="blue"
                  active={state.highBeam}
                  onPress={() =>
                    onPatch({ highBeam: !state.highBeam }, `HIGH BEAM · 远光${!state.highBeam ? '开启' : '关闭'}`)
                  }
                />
                <RockerSwitch
                  label="前雾灯"
                  subLabel="FOG"
                  icon="frontFog"
                  ledColor="green"
                  active={state.frontFog}
                  onPress={() => onPatch({ frontFog: !state.frontFog }, 'FOG LIGHT · 前雾灯切换')}
                />
                <RockerSwitch
                  label="危险双闪"
                  subLabel="[F]"
                  icon="hazard"
                  ledColor="red"
                  hazardStyle
                  active={state.hazardLights}
                  blinkingOff={state.hazardLights && !state.blinkerPhaseOn}
                  onPress={() =>
                    onPatch(
                      { hazardLights: !state.hazardLights },
                      `HAZARD · 双闪${!state.hazardLights ? '开启' : '关闭'}`
                    )
                  }
                />
              </View>

              <View style={styles.gridRow}>
                <RockerSwitch
                  label="车顶射灯"
                  subLabel="F4"
                  icon="roofAux"
                  ledColor="amber"
                  active={state.roofAuxLights}
                  onPress={() =>
                    onPatch({ roofAuxLights: !state.roofAuxLights }, 'ROOF AUX · 车顶射灯切换')
                  }
                />
                <RockerSwitch
                  label="中网射灯"
                  subLabel="AUX"
                  icon="grillLight"
                  ledColor="amber"
                  active={state.frontGrillLights}
                  onPress={() =>
                    onPatch({ frontGrillLights: !state.frontGrillLights }, 'GRILL AUX · 中网射灯切换')
                  }
                />
                <RockerSwitch
                  label="警示爆闪"
                  subLabel="[O]"
                  icon="beacon"
                  ledColor="amber"
                  active={state.beacon}
                  blinkingOff={state.beacon && !state.blinkerPhaseOn}
                  onPress={() => onPatch({ beacon: !state.beacon }, 'BEACON · 车顶旋转警示灯')}
                />
                <RockerSwitch
                  label={`雨刷·${WIPER_LABELS[state.wiperMode]}`}
                  subLabel="[P]"
                  icon="wiper"
                  ledColor="cyan"
                  active={state.wiperMode > 0}
                  onPress={cycleWiper}
                />
                <RockerSwitch
                  label="玻璃喷水"
                  subLabel="WSH"
                  icon="washer"
                  ledColor="blue"
                  momentary
                  onPress={() => onMomentaryCommand('WASHER · 前挡风喷水清洁')}
                />
              </View>

              <View style={styles.gridRow}>
                <RockerSwitch
                  label="电子手刹"
                  subLabel="(P)"
                  icon="parkingBrake"
                  ledColor="red"
                  guarded
                  active={state.parkingBrake}
                  onPress={() => {
                    CockpitHaptics.airBrakeValve();
                    onPatch(
                      { parkingBrake: !state.parkingBrake },
                      `PARKING BRAKE · ${!state.parkingBrake ? '气刹驻车锁止' : '气刹放气释放'}`
                    );
                  }}
                />
                <RockerSwitch
                  label={state.engineRunning ? '发动机开' : '点火启动'}
                  subLabel="[E]"
                  icon="engine"
                  ledColor="green"
                  active={state.engineRunning}
                  onPress={() => {
                    CockpitHaptics.warningPulse();
                    const next = !state.engineRunning;
                    onPatch(
                      { ignitionOn: next ? true : state.ignitionOn, engineRunning: next, rpm: next ? 600 : 0 },
                      `ENGINE · 发动机${next ? '启动运转' : '熄火停机'}`
                    );
                  }}
                />
                <RockerSwitch
                  label="轮间差速"
                  subLabel="[V]"
                  icon="diffLock"
                  ledColor="amber"
                  guarded
                  active={state.diffLock}
                  onPress={() =>
                    onPatch({ diffLock: !state.diffLock }, `DIFF LOCK · 轮间差速锁${!state.diffLock ? '啮合' : '解除'}`)
                  }
                />
                <RockerSwitch
                  label="排气制动"
                  subLabel="[B]"
                  icon="exhaustBrake"
                  ledColor="amber"
                  active={state.exhaustBrake}
                  onPress={() =>
                    onPatch({ exhaustBrake: !state.exhaustBrake }, 'EXHAUST BRAKE · 排气制动切换')
                  }
                />
                <RockerSwitch
                  label="确认交互"
                  subLabel="ENT"
                  icon="enterAct"
                  ledColor="green"
                  momentary
                  onPress={() => onMomentaryCommand('ACTIVATE [Enter] · 收费站/加油/装卸货确认')}
                />
              </View>
            </View>

            {/* ======== BAY 2: DAYLIGHT 6x4 CHASSIS TELEMETRY + 5×2 AXLE & SUSPENSION ======== */}
            <View style={[styles.bayPage, { width: deckWidth }]}>
              <View style={styles.chassisMonitor}>
                <View pointerEvents="none" style={{ flex: 1.5, alignItems: 'flex-start' }}>
                  <Svg width={190} height={36} viewBox="0 0 230 40">
                    {/* Tractor Frame */}
                    <Line x1="20" y1="20" x2="118" y2="20" stroke="#2f6bff" strokeWidth="2.5" />
                    {/* Trailer Frame */}
                    <Line
                      x1="122"
                      y1="20"
                      x2="215"
                      y2="20"
                      stroke={state.trailerAttached ? '#2f6bff' : '#94a3b8'}
                      strokeWidth="2.2"
                      strokeDasharray={state.trailerAttached ? undefined : '4 3'}
                    />
                    {/* Steer Axle */}
                    <Line x1="32" y1="7" x2="32" y2="33" stroke="#161c2a" strokeWidth="1.8" />
                    <Rect x="27" y="3" width="10" height="5.5" rx="2" fill="#161c2a" />
                    <Rect x="27" y="31.5" width="10" height="5.5" rx="2" fill="#161c2a" />
                    {/* Truck Lift Axle */}
                    <Line x1="78" y1="7" x2="78" y2="33" stroke="#161c2a" strokeWidth="1.8" />
                    <Rect
                      x="73"
                      y="3"
                      width="10"
                      height="5.5"
                      rx="2"
                      fill={state.truckLiftAxle ? '#ff8a00' : '#334155'}
                    />
                    <Rect
                      x="73"
                      y="31.5"
                      width="10"
                      height="5.5"
                      rx="2"
                      fill={state.truckLiftAxle ? '#ff8a00' : '#334155'}
                    />
                    {/* Drive Axle + Diff Lock Core */}
                    <Line x1="98" y1="7" x2="98" y2="33" stroke="#161c2a" strokeWidth="2.2" />
                    <Rect x="93" y="3" width="10" height="5.5" rx="2" fill="#161c2a" />
                    <Rect x="93" y="31.5" width="10" height="5.5" rx="2" fill="#161c2a" />
                    <Circle
                      cx="98"
                      cy="20"
                      r="5"
                      fill={state.diffLock ? '#ff8a00' : '#ffffff'}
                      stroke="#2f6bff"
                      strokeWidth="1.5"
                    />
                    {/* Fifth Wheel */}
                    <Circle
                      cx="118"
                      cy="20"
                      r="4.2"
                      fill={state.trailerAttached ? '#16a34a' : '#e11d48'}
                    />
                    {/* Trailer Axles */}
                    <Rect
                      x="174"
                      y="4"
                      width="9"
                      height="5.5"
                      rx="2"
                      fill={state.trailerLiftAxle ? '#ff8a00' : '#475569'}
                    />
                    <Rect
                      x="174"
                      y="30.5"
                      width="9"
                      height="5.5"
                      rx="2"
                      fill={state.trailerLiftAxle ? '#ff8a00' : '#475569'}
                    />
                    <Rect x="194" y="4" width="9" height="5.5" rx="2" fill="#9096a3" />
                    <Rect x="194" y="30.5" width="9" height="5.5" rx="2" fill="#9096a3" />
                  </Svg>
                </View>

                <View style={styles.suspReadoutCol}>
                  <Text style={styles.suspReadoutTxt}>
                    前桥 {state.frontSuspOffset >= 0 ? '+' : ''}
                    {state.frontSuspOffset} mm
                  </Text>
                  <Text style={styles.suspReadoutTxt}>
                    后桥 {state.rearSuspOffset >= 0 ? '+' : ''}
                    {state.rearSuspOffset} mm
                  </Text>
                  <Text
                    style={[
                      styles.suspSubStatus,
                      { color: state.trailerAttached ? '#15803d' : '#be123c' },
                    ]}
                  >
                    {state.trailerAttached ? '● 鞍座锁止' : '○ 挂车分离'}
                  </Text>
                </View>
              </View>

              <View style={styles.gridRow}>
                <RockerSwitch
                  label="电门通电"
                  subLabel="IGN"
                  icon="ignition"
                  ledColor="amber"
                  active={state.ignitionOn}
                  onPress={() =>
                    onPatch(
                      { ignitionOn: !state.ignitionOn, engineRunning: !state.ignitionOn ? state.engineRunning : false },
                      'IGNITION · 电门开关切换'
                    )
                  }
                />
                <RockerSwitch
                  label="主车升桥"
                  subLabel="[U]"
                  icon="truckLiftAxle"
                  ledColor="amber"
                  active={state.truckLiftAxle}
                  onPress={() =>
                    onPatch({ truckLiftAxle: !state.truckLiftAxle }, 'TRUCK LIFT · 主车提升桥切换')
                  }
                />
                <RockerSwitch
                  label="挂车升桥"
                  subLabel="[Y]"
                  icon="trailerLiftAxle"
                  ledColor="amber"
                  active={state.trailerLiftAxle}
                  onPress={() =>
                    onPatch({ trailerLiftAxle: !state.trailerLiftAxle }, 'TRAILER LIFT · 挂车提升桥切换')
                  }
                />
                <RockerSwitch
                  label={state.trailerAttached ? '鞍座已锁' : '挂车摘脱'}
                  subLabel="[T]"
                  icon="trailerCouple"
                  ledColor={state.trailerAttached ? 'green' : 'red'}
                  guarded
                  active={state.trailerAttached}
                  onPress={() => {
                    CockpitHaptics.warningPulse();
                    onPatch(
                      { trailerAttached: !state.trailerAttached },
                      `TRAILER [T] · 挂车${!state.trailerAttached ? '连接锁止' : '解锁脱离'}`
                    );
                  }}
                />
                <RockerSwitch
                  label="轮间差速"
                  subLabel="[V]"
                  icon="diffLock"
                  ledColor="amber"
                  guarded
                  active={state.diffLock}
                  onPress={() => onPatch({ diffLock: !state.diffLock }, 'DIFF LOCK · 差速锁切换')}
                />
              </View>

              <View style={styles.gridRow}>
                <RockerSwitch
                  label="前桥升高"
                  subLabel="F▲"
                  icon="suspUp"
                  ledColor="cyan"
                  momentary
                  onPress={() =>
                    onPatch(
                      { frontSuspOffset: Math.min(80, state.frontSuspOffset + 20) },
                      'AIR SUSP · 前桥升高 +20mm'
                    )
                  }
                />
                <RockerSwitch
                  label="前桥降低"
                  subLabel="F▼"
                  icon="suspDown"
                  ledColor="cyan"
                  momentary
                  onPress={() =>
                    onPatch(
                      { frontSuspOffset: Math.max(-60, state.frontSuspOffset - 20) },
                      'AIR SUSP · 前桥降低 -20mm'
                    )
                  }
                />
                <RockerSwitch
                  label="后桥升高"
                  subLabel="R▲"
                  icon="suspUp"
                  ledColor="cyan"
                  momentary
                  onPress={() =>
                    onPatch(
                      { rearSuspOffset: Math.min(80, state.rearSuspOffset + 20) },
                      'AIR SUSP · 后桥升高 +20mm'
                    )
                  }
                />
                <RockerSwitch
                  label="后桥降低"
                  subLabel="R▼"
                  icon="suspDown"
                  ledColor="cyan"
                  momentary
                  onPress={() =>
                    onPatch(
                      { rearSuspOffset: Math.max(-60, state.rearSuspOffset - 20) },
                      'AIR SUSP · 后桥降低 -20mm'
                    )
                  }
                />
                <RockerSwitch
                  label="高度归零"
                  subLabel="RST"
                  icon="suspReset"
                  ledColor="green"
                  active={state.frontSuspOffset === 0 && state.rearSuspOffset === 0}
                  onPress={() =>
                    onPatch(
                      { frontSuspOffset: 0, rearSuspOffset: 0 },
                      'AIR SUSP RESET · 恢夌标准行车高度'
                    )
                  }
                />
              </View>
            </View>

            {/* ======== BAY 3: 5×3 GEARBOX, RETARDER & ADAS MATRIX ======== */}
            <View style={[styles.bayPage, { width: deckWidth }]}>
              <View style={styles.gridRow}>
                <RockerSwitch
                  label="ECO节油"
                  subLabel="M1"
                  icon="cruise"
                  ledColor="green"
                  active={state.drivePowerMode === 0}
                  onPress={() => onPatch({ drivePowerMode: 0 }, 'OPTICRUISE · ECO 经济巡航模式')}
                />
                <RockerSwitch
                  label="STD标准"
                  subLabel="M2"
                  icon="cruise"
                  ledColor="cyan"
                  active={state.drivePowerMode === 1}
                  onPress={() => onPatch({ drivePowerMode: 1 }, 'OPTICRUISE · STD 标准均衡模式')}
                />
                <RockerSwitch
                  label="PWR重载"
                  subLabel="M3"
                  icon="engine"
                  ledColor="amber"
                  active={state.drivePowerMode === 2}
                  onPress={() => onPatch({ drivePowerMode: 2 }, 'OPTICRUISE · POWER 大件重载模式')}
                />
                <RockerSwitch
                  label={state.manualSequential ? '序列手动' : '全自动挡'}
                  subLabel="A/M"
                  icon="rangeGear"
                  ledColor="cyan"
                  active={state.manualSequential}
                  onPress={() =>
                    onPatch(
                      { manualSequential: !state.manualSequential },
                      `GEARBOX · 切换${!state.manualSequential ? '序列手动' : '自动挡'}`
                    )
                  }
                />
                <RockerSwitch
                  label="坡起防溜"
                  subLabel="HIL"
                  icon="hillHold"
                  ledColor="green"
                  active={state.hillHold}
                  onPress={() => onPatch({ hillHold: !state.hillHold }, 'HILL HOLD · 坡道防溜车辅助')}
                />
              </View>

              <View style={styles.gridRow}>
                <RockerSwitch
                  label={state.rangeHigh ? '高档区H' : '低档区L'}
                  subLabel="RNG"
                  icon="rangeGear"
                  ledColor="amber"
                  active={state.rangeHigh}
                  onPress={() =>
                    onPatch({ rangeHigh: !state.rangeHigh }, 'RANGE · 高低速副箱切换')
                  }
                />
                <RockerSwitch
                  label={state.splitterHigh ? '半档高H' : '半档低L'}
                  subLabel="SPL"
                  icon="splitGear"
                  ledColor="green"
                  active={state.splitterHigh}
                  onPress={() =>
                    onPatch({ splitterHigh: !state.splitterHigh }, 'SPLITTER · 半档拨片切换')
                  }
                />
                <RockerSwitch
                  label="车道保持"
                  subLabel="LKA"
                  icon="laneKeep"
                  ledColor="green"
                  active={state.laneKeepAssist}
                  onPress={() =>
                    onPatch({ laneKeepAssist: !state.laneKeepAssist }, 'LKA · 车道保持辅助')
                  }
                />
                <RockerSwitch
                  label="90限速"
                  subLabel="LIM"
                  icon="speedLimit"
                  ledColor="amber"
                  active={state.speedLimiter}
                  onPress={() =>
                    onPatch({ speedLimiter: !state.speedLimiter }, 'LIMITER · 90km/h 电子限速器')
                  }
                />
                <RockerSwitch
                  label={`跟车距·${state.accDistanceStep}`}
                  subLabel="ACC"
                  icon="cruise"
                  ledColor="cyan"
                  active={state.accDistanceStep > 1}
                  onPress={() => {
                    const next = (state.accDistanceStep % 4) + 1;
                    onPatch({ accDistanceStep: next }, `ACC · 跟车距离 ${next} 档`);
                  }}
                />
              </View>

              <View style={styles.gridRow}>
                <RockerSwitch
                  label="定速巡航"
                  subLabel="[C]"
                  icon="cruise"
                  ledColor="cyan"
                  active={state.cruiseEnabled}
                  onPress={() =>
                    onPatch(
                      { cruiseEnabled: !state.cruiseEnabled },
                      `CRUISE [C] · 巡航${!state.cruiseEnabled ? '开启' : '取消'}`
                    )
                  }
                />
                <RockerSwitch
                  label="巡航 -5"
                  subLabel="SET-"
                  icon="cruise"
                  ledColor="cyan"
                  momentary
                  onPress={() =>
                    onPatch(
                      { cruiseSpeedKmh: Math.max(30, state.cruiseSpeedKmh - 5) },
                      `CRUISE · 设定 ${Math.max(30, state.cruiseSpeedKmh - 5)} km/h`
                    )
                  }
                />
                <RockerSwitch
                  label="巡航 +5"
                  subLabel="RES+"
                  icon="cruise"
                  ledColor="cyan"
                  momentary
                  onPress={() =>
                    onPatch(
                      { cruiseSpeedKmh: Math.min(110, state.cruiseSpeedKmh + 5) },
                      `CRUISE · 设定 ${Math.min(110, state.cruiseSpeedKmh + 5)} km/h`
                    )
                  }
                />
                <RockerSwitch
                  label="缓速减档"
                  subLabel="R-"
                  icon="retarder"
                  ledColor="amber"
                  momentary
                  onPress={() =>
                    onPatch(
                      { retarderLevel: Math.max(0, state.retarderLevel - 1) },
                      `RETARDER · 液力缓速器 R${Math.max(0, state.retarderLevel - 1)}`
                    )
                  }
                />
                <RockerSwitch
                  label={`缓速 R${state.retarderLevel}+`}
                  subLabel="R+"
                  icon="retarder"
                  ledColor="amber"
                  active={state.retarderLevel > 0}
                  onPress={() =>
                    onPatch(
                      { retarderLevel: Math.min(5, state.retarderLevel + 1) },
                      `RETARDER · 液力缓速器 R${Math.min(5, state.retarderLevel + 1)}`
                    )
                  }
                />
              </View>
            </View>

            {/* ======== BAY 4: CALIBRATED FREELOOK, CAMERAS, WINDOWS & PC LINK ======== */}
            <View style={[styles.bayPage, { width: deckWidth }]}>
              <View
                style={styles.freelookBar}
                {...(Platform.OS === 'web' ? ({ dataSet: { noswipe: '1' } } as object) : {})}
                onLayout={(e) => {
                  freelookWidthRef.current = Math.max(120, e.nativeEvent.layout.width);
                }}
                onTouchStart={(e) => {
                  setDeckScrollEnabled(false);
                  const yaw = Math.max(-1, Math.min(1, (e.nativeEvent.locationX / freelookWidthRef.current) * 2 - 1));
                  onPatch({ lookYaw: yaw }, `FREELOOK · 转头 ${Math.round(yaw * 90)}°`);
                }}
                onTouchMove={(e) => {
                  const yaw = Math.max(-1, Math.min(1, (e.nativeEvent.locationX / freelookWidthRef.current) * 2 - 1));
                  onPatch({ lookYaw: yaw });
                }}
                onTouchEnd={() => {
                  setDeckScrollEnabled(true);
                  if (state.lookAutoCenter) {
                    CockpitHaptics.tick();
                    onPatch({ lookYaw: 0 }, 'FREELOOK · 视角回正');
                  }
                }}
                onTouchCancel={() => setDeckScrollEnabled(true)}
              >
                <Text style={styles.freelookSideTxt}>◀ 左后视镜</Text>
                <View style={styles.freelookScale}>
                  {[-60, -30, 0, 30, 60].map((d) => (
                    <View key={d} style={[styles.scaleTick, d === 0 && styles.scaleTickCenter]} />
                  ))}
                  <View
                    style={[
                      styles.freelookThumb,
                      { left: `${((state.lookYaw + 1) / 2) * 86 + 3}%` },
                    ]}
                  >
                    <Text style={styles.freelookDegTxt}>{Math.round(state.lookYaw * 90)}°</Text>
                  </View>
                </View>
                <Pressable
                  onPress={() =>
                    onPatch({ lookAutoCenter: !state.lookAutoCenter, lookYaw: 0 }, 'FREELOOK · 回中切换')
                  }
                  style={[styles.holdViewChip, state.lookAutoCenter && styles.holdViewChipOn]}
                >
                  <Text
                    style={[
                      styles.holdViewTxt,
                      state.lookAutoCenter && { color: '#ffffff' },
                    ]}
                  >
                    {state.lookAutoCenter ? '松手回中' : '锁视角'}
                  </Text>
                </Pressable>
              </View>

              <View style={styles.gridRow}>
                <RockerSwitch
                  label="驾驶视角"
                  subLabel="[1]"
                  icon="camInterior"
                  ledColor="green"
                  active={state.activeCamera === 1}
                  onPress={() => onPatch({ activeCamera: 1, lookYaw: 0 }, 'CAM [1] · 驾驶室内主视角')}
                />
                <RockerSwitch
                  label="探头倒车"
                  subLabel="[5]"
                  icon="camLean"
                  ledColor="amber"
                  active={state.activeCamera === 5}
                  onPress={() => onPatch({ activeCamera: 5 }, 'CAM [5] · 探窗后觅倒库视角')}
                />
                <RockerSwitch
                  label="车外追随"
                  subLabel="[2]"
                  icon="camChase"
                  ledColor="cyan"
                  active={state.activeCamera === 2}
                  onPress={() => onPatch({ activeCamera: 2 }, 'CAM [2] · 车外360环绕视角')}
                />
                <RockerSwitch
                  label={`左窗${state.leftWindowOpen}%`}
                  subLabel="WIN"
                  icon="windowL"
                  ledColor="cyan"
                  active={state.leftWindowOpen > 0}
                  onPress={() => {
                    const next = state.leftWindowOpen >= 100 ? 0 : state.leftWindowOpen + 50;
                    onPatch({ leftWindowOpen: next }, `WINDOW L · 左车窗开度 ${next}%`);
                  }}
                />
                <RockerSwitch
                  label={`右窗${state.rightWindowOpen}%`}
                  subLabel="WIN"
                  icon="windowR"
                  ledColor="cyan"
                  active={state.rightWindowOpen > 0}
                  onPress={() => {
                    const next = state.rightWindowOpen >= 100 ? 0 : state.rightWindowOpen + 50;
                    onPatch({ rightWindowOpen: next }, `WINDOW R · 右车窗开度 ${next}%`);
                  }}
                />
              </View>

              <View style={styles.gridRow}>
                <RockerSwitch
                  label="仪表翻页"
                  subLabel="[I]"
                  icon="info"
                  ledColor="cyan"
                  momentary
                  onPress={() => onMomentaryCommand('DASH [I] · 液晶行车电脑翻页')}
                />
                <RockerSwitch
                  label="地图缩放"
                  subLabel="F5"
                  icon="mapZoom"
                  ledColor="amber"
                  momentary
                  onPress={() => onMomentaryCommand('MAP [F5] · 导航地图比例尺切换')}
                />
                <RockerSwitch
                  label="路线顾问"
                  subLabel="F3"
                  icon="advisor"
                  ledColor="amber"
                  momentary
                  onPress={() => onMomentaryCommand('ADVISOR [F3] · 路线顾问切换')}
                />
                <RockerSwitch
                  label="车载电台"
                  subLabel="[R]"
                  icon="horn"
                  ledColor="green"
                  active={state.radioPlaying}
                  onPress={() => onPatch({ radioPlaying: !state.radioPlaying }, 'RADIO [R] · 车载音乐电台')}
                />
                <RockerSwitch
                  label="紧急救援"
                  subLabel="F7"
                  icon="tow"
                  ledColor="red"
                  guarded
                  momentary
                  onPress={() => {
                    CockpitHaptics.warningPulse();
                    onMomentaryCommand('RESCUE [F7] · 呼叫拖车救援服务');
                  }}
                />
              </View>

              {/* Slim Integrated Steering Lock + PC IP Link Strip */}
              <View style={styles.pcLinkStrip}>
                {([900, 1800] as SteeringLockRange[]).map((deg) => {
                  const active = state.steeringLock === deg;
                  return (
                    <Pressable
                      key={deg}
                      onPress={() => {
                        CockpitHaptics.switchClick();
                        onPatch(
                          {
                            steeringLock: deg,
                            steeringAngle: Math.max(-deg / 2, Math.min(deg / 2, state.steeringAngle)),
                          },
                          `LOCK · 方向盘转向角 ${deg}°`
                        );
                      }}
                      style={[styles.degBtn, active && styles.degBtnActive]}
                    >
                      <Text style={[styles.degBtnTxt, active && { color: '#ffffff' }]}>{deg}°</Text>
                    </Pressable>
                  );
                })}
                <TextInput
                  value={state.pcHost}
                  onChangeText={(txt) => onPatch({ pcHost: txt })}
                  placeholder="PC IP"
                  placeholderTextColor="#94a3b8"
                  style={styles.ipInput}
                />
                {!state.wsConnected && (
                  <Pressable
                    onPress={() => {
                      CockpitHaptics.tick();
                      onAutoDiscoverPc();
                    }}
                    style={styles.degBtn}
                  >
                    <Text style={styles.degBtnTxt}>{scanningPc ? '扫描中…' : '搜电脑'}</Text>
                  </Pressable>
                )}
                <Pressable
                  onPress={() => {
                    CockpitHaptics.switchClick();
                    onConnectPc();
                  }}
                  style={[styles.pcBtn, state.wsConnected && styles.pcBtnOnline]}
                >
                  <Text style={styles.pcBtnTxt}>{state.wsConnected ? '断开' : '连PC'}</Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </View>

        {/* Daylight Segmented Bay Selector */}
        <View style={styles.tabBar}>
          {BAY_TABS.map((tab) => {
            const active = activeBay === tab.idx;
            return (
              <Pressable
                key={tab.code}
                onPress={() => jumpToBay(tab.idx)}
                style={[styles.tabPill, active && styles.tabPillActive]}
              >
                <View style={[styles.tabDot, active && styles.tabDotActive]} />
                <Text style={[styles.tabText, active && styles.tabTextActive]}>
                  {tab.short}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  wrapper: { flex: 1, justifyContent: 'space-between', gap: 8 },
  deckViewport: { flex: 1, overflow: 'hidden' },
  bayPage: { flex: 1, paddingTop: 3, paddingBottom: 8, paddingHorizontal: 6, justifyContent: 'space-between', gap: 7 },
  gridRow: { flex: 1, flexDirection: 'row', gap: 7 },
  chassisMonitor: {
    height: 48,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    boxShadow: CockpitTheme.shadowSoft,
  },
  suspReadoutCol: { flex: 1, alignItems: 'flex-end', justifyContent: 'center', gap: 1 },
  suspReadoutTxt: { fontSize: 9.5, fontWeight: '700', color: CockpitTheme.inkSoft, fontVariant: ['tabular-nums'] },
  suspSubStatus: { fontSize: 9.5, fontWeight: '800' },
  freelookBar: {
    height: 38,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    gap: 8,
    boxShadow: CockpitTheme.shadowSoft,
  },
  freelookSideTxt: { fontSize: 9.5, fontWeight: '700', color: CockpitTheme.muted },
  freelookScale: {
    flex: 1,
    height: 24,
    backgroundColor: '#f3f1ec',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    position: 'relative',
  },
  scaleTick: { width: 2, height: 8, borderRadius: 1, backgroundColor: '#d3cdc1' },
  scaleTickCenter: { height: 13, backgroundColor: CockpitTheme.ink },
  freelookThumb: {
    position: 'absolute',
    width: 38,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ff6a1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  freelookDegTxt: { fontSize: 9, fontWeight: '800', color: '#ffffff' },
  holdViewChip: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 10, backgroundColor: '#f3f1ec' },
  holdViewChipOn: { backgroundColor: '#12b76a' },
  holdViewTxt: { fontSize: 9, fontWeight: '800', color: CockpitTheme.inkSoft },
  pcLinkStrip: {
    height: 34,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingHorizontal: 6,
    gap: 6,
    boxShadow: CockpitTheme.shadowSoft,
  },
  degBtn: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 10, backgroundColor: '#f3f1ec' },
  degBtnActive: { backgroundColor: CockpitTheme.ink },
  degBtnTxt: { fontSize: 9.5, fontWeight: '800', color: CockpitTheme.inkSoft },
  ipInput: {
    flex: 1,
    height: 24,
    backgroundColor: '#f3f1ec',
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 0,
    fontSize: 10,
    fontWeight: '700',
    color: CockpitTheme.ink,
  },
  pcBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, backgroundColor: '#ff6a1a' },
  pcBtnOnline: { backgroundColor: '#f04438' },
  pcBtnTxt: { fontSize: 9.5, fontWeight: '800', color: '#ffffff' },
  tabBar: { flexDirection: 'row', gap: 6 },
  tabPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: 'transparent',
    gap: 5,
  },
  tabPillActive: { backgroundColor: CockpitTheme.ink },
  tabDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#cfc9bd' },
  tabDotActive: { backgroundColor: '#ff6a1a' },
  tabText: { fontSize: 10, fontWeight: '700', color: CockpitTheme.muted },
  tabTextActive: { color: '#ffffff', fontWeight: '800' },
});
