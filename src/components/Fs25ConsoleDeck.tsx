import React, { useRef, useState } from 'react';
import {
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { CockpitTheme } from '../theme/cockpitTheme';
import { FS25_TOOL_SLOTS, Fs25ControllerState } from '../types/fs25State';
import { SteeringLockRange } from '../types/truckState';
import { CockpitHaptics } from '../utils/haptics';
import { RockerSwitch } from './RockerSwitch';

interface Fs25ConsoleDeckProps {
  fs: Fs25ControllerState;
  activeBay: number;
  steeringLock: SteeringLockRange;
  steeringAngle: number;
  lookYaw: number;
  lookAutoCenter: boolean;
  blinkerPhaseOn: boolean;
  pcHost: string;
  wsConnected: boolean;
  soundEnabled: boolean;
  onBayChange: (bayIndex: number) => void;
  onFsPatch: (patch: Partial<Fs25ControllerState>, tag?: string) => void;
  onFsAction: (action: string, tag: string, opts?: { holdMs?: number; times?: number }) => void;
  onHeadlandEnter: () => void;
  onHeadlandExit: () => void;
  onLoaderHoldAxis: (dx: number, dy: number) => void;
  onHornHold: (down: boolean) => void;
  onSteeringLockChange: (deg: SteeringLockRange) => void;
  onLookChange: (yaw: number, autoCenter?: boolean, tag?: string) => void;
  onPcHostChange: (txt: string) => void;
  onConnectPc: () => void;
  onAutoDiscoverPc: () => void;
  scanningPc?: boolean;
  onToggleSound: () => void;
}

const BAY_TABS = [
  { idx: 0, short: '1·农具作业', code: 'TOOLS' },
  { idx: 1, short: '2·智驾地头', code: 'ITEC' },
  { idx: 2, short: '3·灯光车队', code: 'LIGHTS' },
  { idx: 3, short: '4·液压连接', code: 'LINK' },
];

const LIGHT_STAGE_NAMES = ['关闭车灯', '近光行车灯', '后方工作灯', '全车强光工作灯'] as const;
const AGRI_GREEN = '#15803d';

export const Fs25ConsoleDeck: React.FC<Fs25ConsoleDeckProps> = React.memo(
  ({
    fs,
    activeBay,
    steeringLock,
    lookYaw,
    lookAutoCenter,
    blinkerPhaseOn,
    pcHost,
    wsConnected,
    soundEnabled,
    onBayChange,
    onFsPatch,
    onFsAction,
    onHeadlandEnter,
    onHeadlandExit,
    onLoaderHoldAxis,
    onHornHold,
    onSteeringLockChange,
    onLookChange,
    onPcHostChange,
    onConnectPc,
    onAutoDiscoverPc,
    scanningPc,
    onToggleSound,
  }) => {
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

    // Desktop/web mouse-drag swipe between bays
    const dragRef = useRef({
      down: false,
      moved: false,
      startX: 0,
      startScroll: 0,
      lastX: 0,
      lastT: 0,
      vx: 0,
    });
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
          try {
            el.setPointerCapture(e.pointerId);
          } catch {}
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

    const stepCruise = (delta: number) => {
      const next = Math.max(1, Math.min(53, fs.cruiseTargetKmh + delta));
      const steps = Math.abs(next - fs.cruiseTargetKmh);
      onFsPatch({ cruiseTargetKmh: next }, `CRUISE [${delta > 0 ? '2' : '1'}] · 目标车速 ${next} km/h`);
      if (steps > 0) {
        onFsAction(
          delta > 0 ? 'cruise_up' : 'cruise_down',
          `CRUISE [${delta > 0 ? '2' : '1'}] · 目标车速 ${next} km/h`,
          { times: steps }
        );
      }
    };

    const updateFreelookFromX = (locX: number) => {
      const w = Math.max(60, freelookWidthRef.current);
      const yaw = Math.max(-1, Math.min(1, (locX / w) * 2 - 1));
      onLookChange(yaw);
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
            {/* ======== BAY 1: 5×3 IMPLEMENTS, HARVESTING & LOGISTICS ======== */}
            <View style={[styles.bayPage, { width: deckWidth }]}>
              <View style={styles.gridRow}>
                <RockerSwitch
                  label="切换农具"
                  subLabel="[G]"
                  icon="tractor"
                  ledColor="amber"
                  momentary
                  onPress={() => {
                    const nextSlot = (fs.activeToolSlot + 1) % FS25_TOOL_SLOTS.length;
                    onFsPatch({ activeToolSlot: nextSlot });
                    onFsAction('switch_tool', `TOOL [G] · 切换至 ${FS25_TOOL_SLOTS[nextSlot]}`);
                  }}
                />
                <RockerSwitch
                  label="挂接脱钩"
                  subLabel="[Q]"
                  icon="hitch"
                  ledColor="amber"
                  guarded
                  momentary
                  onPress={() => onFsAction('attach', 'ATTACH [Q] · 挂接 / 脱钩农具与传动轴')}
                />
                <RockerSwitch
                  label="展开折叠"
                  subLabel="[X]"
                  icon="unfold"
                  ledColor="cyan"
                  active={!fs.toolUnfolded}
                  onPress={() => {
                    const next = !fs.toolUnfolded;
                    onFsPatch({ toolUnfolded: next });
                    onFsAction('fold_tool', `FOLD [X] · 农具${next ? '工作展开' : '运输折叠'}`);
                  }}
                />
                <RockerSwitch
                  label="升降当前"
                  subLabel="[V]"
                  icon="implementLift"
                  ledColor="green"
                  active={fs.toolLowered}
                  onPress={() => {
                    const next = !fs.toolLowered;
                    onFsPatch({ toolLowered: next });
                    onFsAction('lower_tool', `LIFT [V] · 当前农具${next ? '降下入土' : '抬起'}`);
                  }}
                />
                <RockerSwitch
                  label="启动农具"
                  subLabel="[B]"
                  icon="pto"
                  ledColor="amber"
                  active={fs.ptoActive}
                  onPress={() => {
                    const next = !fs.ptoActive;
                    onFsPatch({ ptoActive: next });
                    onFsAction('turn_on_tool', `PTO [B] · 农具动力输出${next ? '启动' : '停止'}`);
                  }}
                />
              </View>

              <View style={styles.gridRow}>
                <RockerSwitch
                  label="全车升降"
                  subLabel="Ctrl+V"
                  icon="implementAll"
                  ledColor="green"
                  momentary
                  onPress={() => {
                    const next = !fs.toolLowered;
                    onFsPatch({ toolLowered: next });
                    onFsAction('lower_all', `ALL LIFT [Ctrl+V] · 前后全农具同步${next ? '降下' : '抬起'}`);
                  }}
                />
                <RockerSwitch
                  label="全车启停"
                  subLabel="Ctrl+B"
                  icon="pto"
                  ledColor="green"
                  momentary
                  onPress={() => {
                    const next = !fs.ptoActive;
                    onFsPatch({ ptoActive: next });
                    onFsAction('turn_on_all', `ALL PTO [Ctrl+B] · 全车农具同步${next ? '启动' : '停止'}`);
                  }}
                />
                <RockerSwitch
                  label="伸出粮筒"
                  subLabel="[O]"
                  icon="pipeOut"
                  ledColor="amber"
                  active={fs.pipeExtended}
                  onPress={() => {
                    const next = !fs.pipeExtended;
                    onFsPatch({ pipeExtended: next });
                    onFsAction('pipe', `PIPE [O] · 收割机卸粮筒${next ? '伸出' : '收回'}`);
                  }}
                />
                <RockerSwitch
                  label="卸粮倾倒"
                  subLabel="[I]"
                  icon="grainUnload"
                  ledColor="amber"
                  momentary
                  onPress={() => onFsAction('unload', 'UNLOAD [I] · 开始卸粮 / 翻斗倾倒')}
                />
                <RockerSwitch
                  label="强制卸货"
                  subLabel="Ctrl+I"
                  icon="grainUnload"
                  ledColor="red"
                  guarded
                  momentary
                  onPress={() => onFsAction('unload_here', 'DUMP HERE [Ctrl+I] · 就地强制卸货')}
                />
              </View>

              <View style={styles.gridRow}>
                <RockerSwitch
                  label="打开篷布"
                  subLabel="[N]"
                  icon="tarpCover"
                  ledColor="cyan"
                  active={fs.coverOpen}
                  onPress={() => {
                    const next = !fs.coverOpen;
                    onFsPatch({ coverOpen: next });
                    onFsAction('cover', `COVER [N] · 货箱/播种机舱盖${next ? '打开' : '关闭'}`);
                  }}
                />
                <RockerSwitch
                  label="作业模式"
                  subLabel="[Z]"
                  icon="rangeGear"
                  ledColor="cyan"
                  momentary
                  onPress={() => onFsAction('work_mode', 'WORK MODE [Z] · 切换铺草条 / 翻转犁 / 撒幅')}
                />
                <RockerSwitch
                  label="加注补给"
                  subLabel="[R]"
                  icon="seedRefill"
                  ledColor="green"
                  momentary
                  onPress={() => onFsAction('refill', 'REFILL [R] · 加注种子 / 化肥 / 柴油补给')}
                />
                <RockerSwitch
                  label="货物绑带"
                  subLabel="[L]"
                  icon="tensionBelt"
                  ledColor="amber"
                  momentary
                  onPress={() => onFsAction('tension_belts', 'BELTS [L] · 紧固 / 解开平板车绑带')}
                />
                <RockerSwitch
                  label="按键提示"
                  subLabel="[F1]"
                  icon="info"
                  ledColor="blue"
                  momentary
                  onPress={() => onFsAction('help_hud', 'HELP [F1] · 开关左上角按键帮助栏')}
                />
              </View>
            </View>

            {/* ======== BAY 2: FS25 GPS ASSIST, AI WORKER, iTEC HEADLAND & FLEET ======== */}
            <View style={[styles.bayPage, { width: deckWidth }]}>
              {/* Top iTEC & Cruise Quick-Config Bar */}
              <View style={styles.itecStrip} {...({ 'data-noswipe': '1' } as object)}>
                <Pressable
                  onPress={() => {
                    CockpitHaptics.tick();
                    onFsPatch(
                      { itecWithPto: !fs.itecWithPto },
                      `iTEC 配置 · 地头宏${!fs.itecWithPto ? '包含' : '不含'} PTO 启停`
                    );
                  }}
                  style={[styles.cfgChip, fs.itecWithPto && styles.cfgChipActive]}
                >
                  <Text style={[styles.cfgChipTxt, fs.itecWithPto && { color: '#ffffff' }]}>
                    宏含PTO
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    CockpitHaptics.tick();
                    onFsPatch(
                      { itecWithCruise: !fs.itecWithCruise },
                      `iTEC 配置 · 地头宏${!fs.itecWithCruise ? '包含' : '不含'}定速巡航`
                    );
                  }}
                  style={[styles.cfgChip, fs.itecWithCruise && styles.cfgChipActive]}
                >
                  <Text style={[styles.cfgChipTxt, fs.itecWithCruise && { color: '#ffffff' }]}>
                    宏含巡航
                  </Text>
                </Pressable>

                <View style={styles.cruiseMiniGroup}>
                  {([-5, -1, 1, 5] as const).map((d) => (
                    <Pressable
                      key={d}
                      onPress={() => {
                        CockpitHaptics.tick();
                        stepCruise(d);
                      }}
                      style={styles.miniStepBtn}
                    >
                      <Text style={styles.miniStepTxt}>{d > 0 ? `+${d}` : `${d}`}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={styles.gridRow}>
                <RockerSwitch
                  label="AI雇工/车道"
                  subLabel="[H]"
                  icon="aiWorker"
                  ledColor="green"
                  active={fs.aiWorkerActive}
                  onPress={() => {
                    const next = !fs.aiWorkerActive;
                    onFsPatch({ aiWorkerActive: next });
                    onFsAction('ai_worker', `WORKER / GPS [H] · 切换 AI 雇工或激活农道`);
                  }}
                />
                <RockerSwitch
                  label="GPS农道设置"
                  subLabel="[长按H]"
                  icon="gpsTrack"
                  ledColor="blue"
                  active={fs.gpsActive}
                  onPress={() => {
                    const next = !fs.gpsActive;
                    onFsPatch({ gpsActive: next });
                    onFsAction(
                      'gps_menu',
                      'FS25 GPS [长按H 0.85s] · 呼出原厂辅助转向农道菜单',
                      { holdMs: 850 }
                    );
                  }}
                />
                <RockerSwitch
                  label={`巡航 ${fs.cruiseTargetKmh}`}
                  subLabel="[3]"
                  icon="cruise"
                  ledColor="green"
                  active={fs.cruiseEnabled}
                  onPress={() => {
                    const next = !fs.cruiseEnabled;
                    onFsPatch({ cruiseEnabled: next });
                    onFsAction(
                      'cruise_toggle',
                      `CRUISE [3] · 田间定速巡航${next ? `锁定 ${fs.cruiseTargetKmh} km/h` : '取消'}`
                    );
                  }}
                />
                <RockerSwitch
                  label="入垄下地宏"
                  subLabel="iTEC▼"
                  icon="headlandIn"
                  ledColor="green"
                  momentary
                  onPress={onHeadlandEnter}
                />
                <RockerSwitch
                  label="地头抬起宏"
                  subLabel="iTEC▲"
                  icon="headlandOut"
                  ledColor="amber"
                  momentary
                  onPress={onHeadlandExit}
                />
              </View>

              <View style={styles.gridRow}>
                <RockerSwitch
                  label={fs.engineRunning ? '发动机着车' : '启动发动机'}
                  subLabel="[Enter]"
                  icon="engine"
                  ledColor="green"
                  active={fs.engineRunning}
                  onPress={() => {
                    const next = !fs.engineRunning;
                    onFsPatch({ engineRunning: next });
                    onFsAction('engine', `ENGINE [Enter] · 柴油机${next ? '点火启动' : '熄火停机'}`);
                  }}
                />
                <RockerSwitch
                  label={fs.shuttleDir === 'R' ? '梭挡·倒车' : '梭挡·前进'}
                  subLabel="[Space]"
                  icon="shuttleFnr"
                  ledColor="amber"
                  active={fs.shuttleDir === 'R'}
                  onPress={() => {
                    const next = fs.shuttleDir === 'R' ? 'F' : 'R';
                    onFsPatch({ shuttleDir: next });
                    onFsAction('direction_change', `SHUTTLE [Space] · 动力换向切至 ${next === 'R' ? '倒退' : '前进'}`);
                  }}
                />
                <RockerSwitch
                  label="上一农机"
                  subLabel="S+Tab"
                  icon="vehicleSwitch"
                  ledColor="cyan"
                  momentary
                  onPress={() => onFsAction('vehicle_prev', 'FLEET [Shift+Tab] · 切换至上一台农机')}
                />
                <RockerSwitch
                  label="下一农机"
                  subLabel="[Tab]"
                  icon="vehicleSwitch"
                  ledColor="cyan"
                  momentary
                  onPress={() => onFsAction('vehicle_next', 'FLEET [Tab] · 切换至下一台农机')}
                />
                <RockerSwitch
                  label="上下农机"
                  subLabel="[E]"
                  icon="enterAct"
                  ledColor="amber"
                  momentary
                  onPress={() => onFsAction('enter_exit', 'CAB [E] · 进出驾驶室下车步行')}
                />
              </View>
            </View>

            {/* ======== BAY 3: WORK LIGHTS, BEACONS, SIGNALS, SHOP & LOADER ======== */}
            <View style={[styles.bayPage, { width: deckWidth }]}>
              <View style={styles.gridRow}>
                <RockerSwitch
                  label={fs.lightStage === 0 ? '工作灯' : LIGHT_STAGE_NAMES[fs.lightStage].slice(0, 4)}
                  subLabel="[F]"
                  icon="workLight"
                  ledColor="green"
                  active={fs.lightStage > 0}
                  onPress={() => {
                    const next = ((fs.lightStage + 1) % 4) as 0 | 1 | 2 | 3;
                    onFsPatch({ lightStage: next });
                    onFsAction('lights_cycle', `LIGHTS [F] · ${LIGHT_STAGE_NAMES[next]}`);
                  }}
                />
                <RockerSwitch
                  label="远光大灯"
                  subLabel="Ctrl+F"
                  icon="highBeam"
                  ledColor="blue"
                  active={fs.highBeam}
                  onPress={() => {
                    const next = !fs.highBeam;
                    onFsPatch({ highBeam: next });
                    onFsAction('high_beam', `HIGH BEAM [Ctrl+F] · 远光${next ? '开启' : '关闭'}`);
                  }}
                />
                <RockerSwitch
                  label="旋转警示"
                  subLabel="[Home]"
                  icon="beacon"
                  ledColor="amber"
                  active={fs.beacon}
                  blinkingOff={fs.beacon && !blinkerPhaseOn}
                  onPress={() => {
                    const next = !fs.beacon;
                    onFsPatch({ beacon: next });
                    onFsAction('beacon', `BEACON [Home] · 车顶农机旋转警示灯${next ? '开启' : '关闭'}`);
                  }}
                />
                <RockerSwitch
                  label="左转向灯"
                  subLabel="[Num1]"
                  icon="parkingLight"
                  ledColor="green"
                  active={fs.turnSignal === -1}
                  blinkingOff={fs.turnSignal === -1 && !blinkerPhaseOn}
                  onPress={() => {
                    const next = fs.turnSignal === -1 ? 0 : -1;
                    onFsPatch({ turnSignal: next });
                    onFsAction('blinker_left', `BLINKER L [Num1] · 左转向灯${next === -1 ? '开启' : '关闭'}`);
                  }}
                />
                <RockerSwitch
                  label="右转向灯"
                  subLabel="[Num3]"
                  icon="parkingLight"
                  ledColor="green"
                  active={fs.turnSignal === 1}
                  blinkingOff={fs.turnSignal === 1 && !blinkerPhaseOn}
                  onPress={() => {
                    const next = fs.turnSignal === 1 ? 0 : 1;
                    onFsPatch({ turnSignal: next });
                    onFsAction('blinker_right', `BLINKER R [Num3] · 右转向灯${next === 1 ? '开启' : '关闭'}`);
                  }}
                />
              </View>

              <View style={styles.gridRow}>
                <RockerSwitch
                  label="危险双闪"
                  subLabel="[Num2]"
                  icon="hazard"
                  ledColor="red"
                  hazardStyle
                  active={fs.hazardLights}
                  blinkingOff={fs.hazardLights && !blinkerPhaseOn}
                  onPress={() => {
                    const next = !fs.hazardLights;
                    onFsPatch({ hazardLights: next });
                    onFsAction('hazard', `HAZARD [Num2] · 农机危险双闪灯${next ? '开启' : '关闭'}`);
                  }}
                />
                <RockerSwitch
                  label="农机喇叭"
                  subLabel="[0]"
                  icon="horn"
                  ledColor="cyan"
                  momentary
                  onPressIn={() => onHornHold(true)}
                  onPressOut={() => onHornHold(false)}
                />
                <RockerSwitch
                  label="视角切换"
                  subLabel="[C]"
                  icon="camChase"
                  ledColor="cyan"
                  momentary
                  onPress={() => onFsAction('camera_cycle', 'CAMERA [C] · 驾驶室 / 车外环绕视角切换')}
                />
                <RockerSwitch
                  label="农机商店"
                  subLabel="[P]"
                  icon="shopBag"
                  ledColor="amber"
                  momentary
                  onPress={() => onFsAction('shop', 'SHOP [P] · 打开农机经销商与租赁目录')}
                />
                <RockerSwitch
                  label="农场建造"
                  subLabel="S+P"
                  icon="advisor"
                  ledColor="amber"
                  momentary
                  onPress={() => onFsAction('build_mode', 'BUILD [Shift+P] · 打开农场建设与地形改造')}
                />
              </View>

              {fs.layout === 'full' ? (
                <View style={styles.gridRow}>
                  <RockerSwitch
                    label="升大臂"
                    subLabel="[按住J]"
                    icon="loaderArm"
                    ledColor="green"
                    momentary
                    onPressIn={() => onLoaderHoldAxis(0, -1)}
                    onPressOut={() => onLoaderHoldAxis(0, 0)}
                  />
                  <RockerSwitch
                    label="降大臂"
                    subLabel="[按住N]"
                    icon="loaderArm"
                    ledColor="green"
                    momentary
                    onPressIn={() => onLoaderHoldAxis(0, 1)}
                    onPressOut={() => onLoaderHoldAxis(0, 0)}
                  />
                  <RockerSwitch
                    label="收铲斗"
                    subLabel="[按住K]"
                    icon="loaderArm"
                    ledColor="amber"
                    momentary
                    onPressIn={() => onLoaderHoldAxis(-1, 0)}
                    onPressOut={() => onLoaderHoldAxis(0, 0)}
                  />
                  <RockerSwitch
                    label="翻铲斗"
                    subLabel="[按住M]"
                    icon="loaderArm"
                    ledColor="amber"
                    momentary
                    onPressIn={() => onLoaderHoldAxis(1, 0)}
                    onPressOut={() => onLoaderHoldAxis(0, 0)}
                  />
                  <RockerSwitch
                    label="地图合同"
                    subLabel="[Esc]"
                    icon="mapZoom"
                    ledColor="blue"
                    momentary
                    onPress={() => onFsAction('map_menu', 'MENU [Esc] · 农田地图 / 合同 / 经济总览')}
                  />
                </View>
              ) : (
                <View style={styles.gridRow}>
                  <RockerSwitch
                    label="手动加档"
                    subLabel="[Num+]"
                    icon="suspUp"
                    ledColor="green"
                    momentary
                    onPress={() => onFsAction('gear_up', 'GEAR + [Num+] · 手动变速箱升档')}
                  />
                  <RockerSwitch
                    label="手动减档"
                    subLabel="[Num-]"
                    icon="suspDown"
                    ledColor="amber"
                    momentary
                    onPress={() => onFsAction('gear_down', 'GEAR - [Num-] · 手动变速箱降档')}
                  />
                  <RockerSwitch
                    label="农具特种"
                    subLabel="[Y]"
                    icon="splitGear"
                    ledColor="cyan"
                    momentary
                    onPress={() => onFsAction('tool_extra_y', 'EXTRA [Y] · 切换草捆尺寸 / 农具特殊功能')}
                  />
                  <RockerSwitch
                    label={soundEnabled ? '音效开启' : '音效静音'}
                    subLabel="SND"
                    icon="horn"
                    ledColor="green"
                    active={soundEnabled}
                    onPress={onToggleSound}
                  />
                  <RockerSwitch
                    label="地图合同"
                    subLabel="[Esc]"
                    icon="mapZoom"
                    ledColor="blue"
                    momentary
                    onPress={() => onFsAction('map_menu', 'MENU [Esc] · 农田地图 / 合同 / 经济总览')}
                  />
                </View>
              )}
            </View>

            {/* ======== BAY 4: CABIN FREELOOK, HYDRAULIC MODE & PC LINK ======== */}
            <View style={[styles.bayPage, { width: deckWidth }]}>
              {/* Cabin Freelook Bar */}
              <View style={styles.freelookBar} {...({ 'data-noswipe': '1' } as object)}>
                <Text style={styles.freelookSideTxt}>驾驶室环视</Text>
                <View
                  style={styles.freelookScale}
                  onLayout={(e) => {
                    freelookWidthRef.current = e.nativeEvent.layout.width;
                  }}
                  onStartShouldSetResponder={() => true}
                  onMoveShouldSetResponder={() => true}
                  onResponderGrant={(e) => {
                    setDeckScrollEnabled(false);
                    updateFreelookFromX(e.nativeEvent.locationX);
                  }}
                  onResponderMove={(e) => {
                    updateFreelookFromX(e.nativeEvent.locationX);
                  }}
                  onResponderRelease={() => {
                    setDeckScrollEnabled(true);
                    if (lookAutoCenter) onLookChange(0);
                  }}
                  onResponderTerminate={() => {
                    setDeckScrollEnabled(true);
                    if (lookAutoCenter) onLookChange(0);
                  }}
                >
                  {[-2, -1, 0, 1, 2].map((t) => (
                    <View
                      key={t}
                      style={[styles.scaleTick, t === 0 && styles.scaleTickCenter]}
                    />
                  ))}
                  <View
                    pointerEvents="none"
                    style={[
                      styles.freelookThumb,
                      { left: `${((lookYaw + 1) / 2) * 80 + 4}%` },
                    ]}
                  >
                    <Text style={styles.freelookDegTxt}>{Math.round(lookYaw * 90)}°</Text>
                  </View>
                </View>
                <Pressable
                  onPress={() =>
                    onLookChange(0, !lookAutoCenter, 'FREELOOK · 视角回中切换')
                  }
                  style={[styles.holdViewChip, lookAutoCenter && styles.holdViewChipOn]}
                >
                  <Text style={[styles.holdViewTxt, lookAutoCenter && { color: '#ffffff' }]}>
                    {lookAutoCenter ? '松手回中' : '锁视角'}
                  </Text>
                </Pressable>
              </View>

              {/* Hydraulic & Layout Quick Config Row */}
              <View style={styles.gridRow}>
                <RockerSwitch
                  label="免设键盘阀"
                  subLabel="J/N/K/M"
                  icon="loaderArm"
                  ledColor="green"
                  active={fs.loaderMode === 'keys'}
                  onPress={() =>
                    onFsPatch(
                      { loaderMode: 'keys' },
                      'LOADER [J/N/K/M] · 液压摇杆设为免改键直连模式'
                    )
                  }
                />
                <RockerSwitch
                  label="线性手柄轴"
                  subLabel="右摇杆XY"
                  icon="loaderArm"
                  ledColor="blue"
                  active={fs.loaderMode === 'analog'}
                  onPress={() =>
                    onFsPatch(
                      { loaderMode: 'analog' },
                      'LOADER [ANALOG] · 液压摇杆设为虚拟手柄右摇杆无级线性轴'
                    )
                  }
                />
                <RockerSwitch
                  label="侧台专享"
                  subLabel="大摇杆"
                  icon="tractor"
                  ledColor="green"
                  active={fs.layout === 'sidepanel'}
                  onPress={() =>
                    onFsPatch(
                      { layout: 'sidepanel' },
                      'LAYOUT · 切换为重型农机扶手侧台（搭配键盘/真方向盘）'
                    )
                  }
                />
                <RockerSwitch
                  label="全驾座舱"
                  subLabel="含方向盘"
                  icon="cruise"
                  ledColor="amber"
                  active={fs.layout === 'full'}
                  onPress={() =>
                    onFsPatch(
                      { layout: 'full' },
                      'LAYOUT · 切换为全触屏农机驾驶座舱（方向盘+踏板+农具台）'
                    )
                  }
                />
              </View>

              {/* PC Link & Steering Angle Strip */}
              <View style={styles.pcLinkStrip} {...({ 'data-noswipe': '1' } as object)}>
                {([900, 1800] as SteeringLockRange[]).map((deg) => {
                  const active = steeringLock === deg;
                  return (
                    <Pressable
                      key={deg}
                      onPress={() => {
                        CockpitHaptics.switchClick();
                        onSteeringLockChange(deg);
                      }}
                      style={[styles.degBtn, active && styles.degBtnActive]}
                    >
                      <Text style={[styles.degBtnTxt, active && { color: '#ffffff' }]}>{deg}°</Text>
                    </Pressable>
                  );
                })}
                <TextInput
                  value={pcHost}
                  onChangeText={onPcHostChange}
                  placeholder="PC IP"
                  placeholderTextColor="#94a3b8"
                  style={styles.ipInput}
                />
                {!wsConnected && (
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
                  style={[styles.pcBtn, wsConnected && styles.pcBtnOnline]}
                >
                  <Text style={styles.pcBtnTxt}>{wsConnected ? '断开' : '连PC'}</Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </View>

        {/* Agri CommandARM Bay Selector */}
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
                <Text style={[styles.tabText, active && styles.tabTextActive]}>{tab.short}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  wrapper: { flex: 1, justifyContent: 'space-between', gap: 7 },
  deckViewport: { flex: 1, overflow: 'hidden' },
  bayPage: {
    flex: 1,
    paddingTop: 3,
    paddingBottom: 6,
    paddingHorizontal: 5,
    justifyContent: 'space-between',
    gap: 6,
  },
  gridRow: { flex: 1, flexDirection: 'row', gap: 6 },
  itecStrip: {
    height: 36,
    backgroundColor: '#ffffff',
    borderRadius: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    gap: 6,
    boxShadow: CockpitTheme.shadowSoft,
  },
  cfgChip: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 9,
    backgroundColor: '#f3f1ec',
  },
  cfgChipActive: {
    backgroundColor: AGRI_GREEN,
  },
  cfgChipTxt: {
    fontSize: 9,
    fontWeight: '800',
    color: CockpitTheme.inkSoft,
  },
  cruiseMiniGroup: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 4,
  },
  miniStepBtn: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#f3f1ec',
  },
  miniStepTxt: {
    fontSize: 9.5,
    fontWeight: '800',
    color: CockpitTheme.ink,
  },
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
    backgroundColor: AGRI_GREEN,
    alignItems: 'center',
    justifyContent: 'center',
  },
  freelookDegTxt: { fontSize: 9, fontWeight: '800', color: '#ffffff' },
  holdViewChip: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: '#f3f1ec',
  },
  holdViewChipOn: { backgroundColor: AGRI_GREEN },
  holdViewTxt: { fontSize: 9, fontWeight: '800', color: CockpitTheme.inkSoft },
  pcLinkStrip: {
    height: 36,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingHorizontal: 6,
    gap: 6,
    boxShadow: CockpitTheme.shadowSoft,
  },
  degBtn: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: '#f3f1ec',
  },
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
  pcBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: AGRI_GREEN,
  },
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
  tabDotActive: { backgroundColor: '#22c55e' },
  tabText: { fontSize: 10, fontWeight: '700', color: CockpitTheme.muted },
  tabTextActive: { color: '#ffffff', fontWeight: '800' },
});
