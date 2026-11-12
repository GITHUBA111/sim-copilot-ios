import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as ScreenOrientation from 'expo-screen-orientation';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { CockpitTheme } from './src/theme/cockpitTheme';
import {
  DriveSelector,
  INITIAL_TRUCK_STATE,
  SteeringLockRange,
  TruckControllerState,
  TurnSignalState,
} from './src/types/truckState';
import {
  FS25_TOOL_SLOTS,
  Fs25ControllerState,
  GameCockpitMode,
  INITIAL_FS25_STATE,
} from './src/types/fs25State';
import { SteeringColumn } from './src/components/SteeringColumn';
import { DigitalMFD } from './src/components/DigitalMFD';
import { CenterConsoleDeck } from './src/components/CenterConsoleDeck';
import { PedalShifterZone } from './src/components/PedalShifterZone';
import { TractorMFD } from './src/components/TractorMFD';
import { Fs25ConsoleDeck } from './src/components/Fs25ConsoleDeck';
import { HydraulicJoystickPod } from './src/components/HydraulicJoystickPod';
import { Fs25RightCommandPod } from './src/components/Fs25RightCommandPod';
import { CockpitGarageModal } from './src/components/CockpitGarageModal';
import { CockpitSounds } from './src/utils/sounds';
import { CockpitHaptics } from './src/utils/haptics';
import { discoverPcCompanion } from './src/utils/lanScan';

// True when this web build is served by the PC companion (not the Expo dev server).
const HOSTED_BY_PC =
  Platform.OS === 'web' &&
  typeof window !== 'undefined' &&
  !!window.location?.port &&
  !['8081', '19006'].includes(window.location.port);

function readInitialSetup(): { mode: GameCockpitMode; showGarage: boolean } {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    try {
      const q = new URLSearchParams(window.location.search).get('game');
      if (q === 'ets2' || q === 'fs25') return { mode: q, showGarage: false };
      const saved = window.localStorage?.getItem('copilot_game_mode');
      if (saved === 'ets2' || saved === 'fs25') return { mode: saved, showGarage: false };
    } catch {
      // Ignore storage access errors
    }
  }
  return { mode: 'fs25', showGarage: true };
}

export default function App() {
  return (
    <SafeAreaProvider>
      <CockpitMain />
    </SafeAreaProvider>
  );
}

function CockpitMain() {
  const insets = useSafeAreaInsets();
  useEffect(() => {
    if (Platform.OS !== 'web') {
      activateKeepAwakeAsync().catch(() => {});
      return () => {
        deactivateKeepAwake().catch(() => {});
      };
    }
  }, []);

  const [initCfg] = useState(readInitialSetup);
  const [gameMode, setGameMode] = useState<GameCockpitMode>(initCfg.mode);
  const [garageOpen, setGarageOpen] = useState<boolean>(initCfg.showGarage);
  const [state, setState] = useState<TruckControllerState>(() =>
    HOSTED_BY_PC
      ? {
          ...INITIAL_TRUCK_STATE,
          pcHost: window.location.hostname,
          pcPort: window.location.port,
          lastCommandTag: 'CommandARM 就绪 · 免插件直连农模2025 / 欧卡2',
        }
      : {
          ...INITIAL_TRUCK_STATE,
          lastCommandTag: 'CommandARM 就绪 · 可直接体验液压摇杆与地头联动宏',
        }
  );
  const [fs, setFs] = useState<Fs25ControllerState>(INITIAL_FS25_STATE);

  const manualOffRef = useRef(false);
  const [scanningPc, setScanningPc] = useState(false);
  const [activeBay, setActiveBay] = useState<number>(0);
  const [fsBay, setFsBay] = useState<number>(0);
  const [webSimDevice, setWebSimDevice] = useState<'iphone16pro' | 'iphone16promax' | 'fullscreen'>(
    'iphone16pro'
  );
  const { width: winWidth, height: winHeight } = useWindowDimensions();

  const gameModeRef = useRef(gameMode);
  gameModeRef.current = gameMode;
  const stateRef = useRef(state);
  stateRef.current = state;
  const fsRef = useRef(fs);
  fsRef.current = fs;

  const manualGearNumRef = useRef<number>(1);
  const wsRef = useRef<WebSocket | null>(null);

  const switchGameMode = useCallback((next: GameCockpitMode) => {
    setGameMode(next);
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      try {
        window.localStorage?.setItem('copilot_game_mode', next);
      } catch {}
    }
    setState((prev) => ({
      ...prev,
      throttle: 0,
      brake: 0,
      throttleLocked: false,
      horn: false,
      airHorn: false,
      lastCommandTag:
        next === 'fs25'
          ? 'MODE · 已切换至《农场模拟 2025》CommandARM 农机座舱'
          : 'MODE · 已切换至《欧洲卡车模拟 2》Scania 重卡座舱',
    }));
    setFs((prev) => ({ ...prev, loaderX: 0, loaderY: 0, horn: false }));
  }, []);

  // Lock to landscape orientation on Android / iOS
  useEffect(() => {
    if (Platform.OS !== 'web') {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE).catch(() => {});
    }
  }, []);

  // Authentic 1.5Hz Automotive & Tractor Flasher Relay (Turn Signals / Hazard / Beacon + Tick-Tock Sound)
  useEffect(() => {
    const timer = setInterval(() => {
      const s = stateRef.current;
      const f = fsRef.current;
      const isFs = gameModeRef.current === 'fs25';

      const anyBlink = isFs
        ? f.turnSignal !== 0 || f.hazardLights || f.beacon
        : s.turnSignal !== 0 || s.hazardLights || s.beacon;
      const audibleTurn = isFs
        ? f.turnSignal !== 0 || f.hazardLights
        : s.turnSignal !== 0 || s.hazardLights;

      if (anyBlink) {
        const nextPhase = !s.blinkerPhaseOn;
        if (audibleTurn) {
          CockpitSounds.play(nextPhase ? 'relayTick' : 'relayTock', 120);
        }
        setState((prev) => ({ ...prev, blinkerPhaseOn: nextPhase }));
      } else if (!s.blinkerPhaseOn) {
        setState((prev) => ({ ...prev, blinkerPhaseOn: true }));
      }
    }, 360);
    return () => clearInterval(timer);
  }, []);

  // 20Hz PC Streaming & Physics Simulation Loop (ETS2 Opticruise + FS25 Vario CVT & Hydraulics)
  useEffect(() => {
    const interval = setInterval(() => {
      const s = stateRef.current;
      const f = fsRef.current;
      const mode = gameModeRef.current;
      const halfLock = s.steeringLock / 2;

      if (mode === 'fs25') {
        // 1. Stream FS25 control frame to PC Companion
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(
            JSON.stringify({
              type: 'fs25_control',
              layout: f.layout,
              steer: Number((s.steeringAngle / halfLock).toFixed(4)),
              throttle: Number(s.throttle.toFixed(3)),
              brake: Number(s.brake.toFixed(3)),
              lookYaw: Number(s.lookYaw.toFixed(3)),
              loaderX: Number(f.loaderX.toFixed(3)),
              loaderY: Number(f.loaderY.toFixed(3)),
              loaderAux: f.loaderAux,
              loaderMode: f.loaderMode,
              horn: f.horn,
            })
          );
        }

        // 2. Smooth 20Hz Vario CVT Tractor & Front-Loader Hydraulic Gauge Response
        const dt = 0.05;
        let nextBoom = f.simBoomHeight;
        let nextTilt = f.simBucketTilt;
        if (Math.abs(f.loaderY) > 0.12) {
          // Pull back (loaderY < 0) raises boom; push forward (loaderY > 0) lowers boom
          nextBoom = Math.max(0, Math.min(100, nextBoom - f.loaderY * 42 * dt));
        }
        if (Math.abs(f.loaderX) > 0.12) {
          nextTilt = Math.max(-45, Math.min(45, nextTilt + f.loaderX * 55 * dt));
        }

        let spd = f.speedKmh;
        let rpm = f.engineRunning ? 800 : 0;

        if (f.engineRunning) {
          const ptoBaseRpm = f.ptoActive ? 1780 : 820;
          if (f.layout === 'full') {
            const wantCruise = f.cruiseEnabled && s.brake < 0.05 && f.shuttleDir === 'F';
            const effThr = wantCruise
              ? spd < f.cruiseTargetKmh
                ? Math.min(0.9, (f.cruiseTargetKmh - spd) * 0.18)
                : 0
              : s.throttle;

            if (f.shuttleDir === 'F') {
              const maxFieldSpd = f.toolLowered ? 22 : 53;
              const accel = effThr * 14;
              const decel = s.brake * 24 + (s.parkingBrake ? 18 : 0) + 1.1;
              spd = Math.max(0, Math.min(maxFieldSpd, spd + (accel - decel) * dt));
            } else if (f.shuttleDir === 'R') {
              const accel = s.throttle * 9.5;
              const decel = s.brake * 20 + 1.2;
              spd = Math.max(0, Math.min(20, spd + (accel - decel) * dt));
            } else {
              spd = Math.max(0, spd - (s.brake * 20 + 1.5) * dt);
            }
            rpm = Math.max(ptoBaseRpm, 820 + (spd / 53) * 1050 + effThr * 380);
          } else {
            // Side-panel mode: reflect Cruise / AI Worker working speed & PTO load
            const targetSpd =
              f.cruiseEnabled || f.aiWorkerActive
                ? f.shuttleDir === 'R'
                  ? Math.min(14, f.cruiseTargetKmh)
                  : f.cruiseTargetKmh
                : 0;
            const diff = targetSpd - spd;
            spd = Math.max(0, spd + Math.max(-14 * dt, Math.min(11 * dt, diff * 0.25)));
            const hydLoad = (Math.abs(f.loaderX) + Math.abs(f.loaderY)) * 180;
            rpm = Math.min(2250, Math.max(ptoBaseRpm, 820 + (spd / 53) * 960) + hydLoad);
          }
        } else {
          spd = Math.max(0, spd - 6 * dt);
          rpm = 0;
        }

        if (
          Math.abs(spd - f.speedKmh) > 0.04 ||
          Math.abs(rpm - f.rpm) > 3 ||
          Math.abs(nextBoom - f.simBoomHeight) > 0.1 ||
          Math.abs(nextTilt - f.simBucketTilt) > 0.1
        ) {
          setFs((prev) => ({
            ...prev,
            speedKmh: spd,
            rpm,
            simBoomHeight: nextBoom,
            simBucketTilt: nextTilt,
          }));
        }
        return;
      }

      // ======== ETS2 STREAMING & OFFLINE PHYSICS ========
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'control',
            steer: Number((s.steeringAngle / halfLock).toFixed(4)),
            steeringAngle: Number(s.steeringAngle.toFixed(1)),
            throttle: Number(s.throttle.toFixed(3)),
            brake: Number(s.brake.toFixed(3)),
            drive: s.driveSelector,
            retarder: s.retarderLevel,
            turnSignal: s.turnSignal,
            highBeam: s.highBeam,
            flashHighBeam: s.flashHighBeam,
            headlightMode: s.headlightMode,
            wiperMode: s.wiperMode,
            parkingBrake: s.parkingBrake,
            diffLock: s.diffLock,
            hazardLights: s.hazardLights,
            beacon: s.beacon,
            frontFog: s.frontFog,
            roofAuxLights: s.roofAuxLights,
            frontGrillLights: s.frontGrillLights,
            engineRunning: s.engineRunning,
            truckLiftAxle: s.truckLiftAxle,
            trailerLiftAxle: s.trailerLiftAxle,
            trailerAttached: s.trailerAttached,
            activeCamera: s.activeCamera,
            exhaustBrake: s.exhaustBrake,
            cruiseEnabled: s.cruiseEnabled,
            horn: s.horn,
            airHorn: s.airHorn,
            lookYaw: Number(s.lookYaw.toFixed(3)),
          })
        );
      }

      if (s.offlineSimEnabled && !s.wsConnected) {
        const dt = 0.05;
        let spd = s.speedKmh;
        let rpm = s.engineRunning ? 600 : 0;
        let gearLabel = 'N';

        const effectiveThrottle =
          s.engineRunning && !s.parkingBrake
            ? s.cruiseEnabled && s.brake < 0.05 && s.retarderLevel === 0 && s.driveSelector === 'D'
              ? spd < s.cruiseSpeedKmh
                ? Math.min(0.85, (s.cruiseSpeedKmh - spd) * 0.12)
                : 0
              : s.throttle
            : 0;

        const pwrBoost = s.drivePowerMode === 2 ? 1.25 : s.drivePowerMode === 0 ? 0.82 : 1.0;

        if (s.driveSelector === 'D') {
          let accel = effectiveThrottle * 11.5 * pwrBoost;
          if (s.speedLimiter && spd >= 90) accel = 0;

          const retarderDecel =
            s.retarderLevel * 3.1 + (s.exhaustBrake && effectiveThrottle < 0.05 ? 2.4 : 0);
          const brakeDecel = s.brake * 24 + (s.parkingBrake ? 18 : 0) + 0.55 + spd * 0.015;

          spd = Math.max(0, Math.min(118, spd + (accel - retarderDecel - brakeDecel) * dt));

          const autoGear = Math.max(1, Math.min(12, Math.floor(spd / 7.8) + 1));
          const gNum = s.manualSequential ? manualGearNumRef.current : autoGear;
          if (!s.manualSequential) manualGearNumRef.current = autoGear;

          gearLabel = `${s.manualSequential ? 'M' : 'A'}${gNum}`;
          if (s.engineRunning) {
            const gearBaseSpeed = (gNum - 1) * 7.6;
            const inGearRatio = Math.max(0, Math.min(1, (spd - gearBaseSpeed) / 9.2));
            rpm = 650 + inGearRatio * 920 + effectiveThrottle * 320;
          }
        } else if (s.driveSelector === 'R') {
          const accel = effectiveThrottle * 6.5;
          const decel = s.brake * 20 + (s.parkingBrake ? 18 : 0) + 0.8;
          spd = Math.max(0, Math.min(22, spd + (accel - decel) * dt));
          gearLabel = s.rangeHigh ? 'R2' : 'R1';
          if (s.engineRunning) {
            rpm = 620 + (spd / 22) * 850 + effectiveThrottle * 250;
          }
        } else {
          const decel = s.brake * 22 + (s.parkingBrake ? 16 : 0) + 0.45;
          spd = Math.max(0, spd - decel * dt);
          gearLabel = 'N';
          if (s.engineRunning) {
            rpm = 600 + s.throttle * 1350;
          }
        }

        const nextCruise =
          s.cruiseEnabled && (s.brake > 0.05 || s.retarderLevel > 0 || s.parkingBrake)
            ? false
            : s.cruiseEnabled;

        if (
          Math.abs(spd - s.speedKmh) > 0.05 ||
          Math.abs(rpm - s.rpm) > 4 ||
          gearLabel !== s.gearDisplay ||
          nextCruise !== s.cruiseEnabled
        ) {
          setState((prev) => ({
            ...prev,
            speedKmh: spd,
            rpm,
            gearDisplay: gearLabel,
            cruiseEnabled: nextCruise,
          }));
        }
      }
    }, 50);

    return () => clearInterval(interval);
  }, []);

  const sendDiscreteEvent = useCallback((eventName: string, payload?: unknown) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'event', event: eventName, payload }));
    }
  }, []);

  const sendFs25Packet = useCallback((packet: Record<string, unknown>) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'fs25_action', ...packet }));
    }
  }, []);

  const handleFsPatch = useCallback((patch: Partial<Fs25ControllerState>, tag?: string) => {
    setFs((prev) => ({ ...prev, ...patch }));
    if (tag) {
      setState((prev) => ({ ...prev, lastCommandTag: tag }));
    }
  }, []);

  const handleFsAction = useCallback(
    (action: string, tag: string, opts?: { holdMs?: number; times?: number }) => {
      setState((prev) => ({ ...prev, lastCommandTag: tag }));
      sendFs25Packet({
        action,
        ...(opts?.holdMs ? { holdMs: opts.holdMs } : {}),
        ...(opts?.times ? { times: opts.times } : {}),
      });
    },
    [sendFs25Packet]
  );

  const handleHeadlandEnter = useCallback(() => {
    const f = fsRef.current;
    setFs((prev) => ({
      ...prev,
      toolLowered: true,
      ptoActive: prev.itecWithPto ? true : prev.ptoActive,
      cruiseEnabled: prev.itecWithCruise ? true : prev.cruiseEnabled,
    }));
    setState((prev) => ({
      ...prev,
      lastCommandTag: `iTEC 入垄联动 · 全降农具${f.itecWithPto ? '+开PTO' : ''}${f.itecWithCruise ? '+开启巡航' : ''}`,
    }));
    sendFs25Packet({
      macro: 'headland_enter',
      withPto: f.itecWithPto,
      withCruise: f.itecWithCruise,
    });
  }, [sendFs25Packet]);

  const handleHeadlandExit = useCallback(() => {
    const f = fsRef.current;
    const wasCruising = f.cruiseEnabled;
    setFs((prev) => ({
      ...prev,
      toolLowered: false,
      ptoActive: prev.itecWithPto ? false : prev.ptoActive,
      cruiseEnabled: prev.itecWithCruise ? false : prev.cruiseEnabled,
    }));
    setState((prev) => ({
      ...prev,
      lastCommandTag: 'iTEC 地头调头 · 自动停航并抬起全部前后农具',
    }));
    sendFs25Packet({
      macro: 'headland_exit',
      stopPto: f.itecWithPto,
      cancelCruise: f.itecWithCruise && wasCruising,
    });
  }, [sendFs25Packet]);

  const handlePatch = useCallback(
    (patch: Partial<TruckControllerState>, tag?: string) => {
      setState((prev) => ({
        ...prev,
        ...patch,
        ...(tag ? { lastCommandTag: tag } : {}),
      }));
      if (tag) sendDiscreteEvent(tag, patch);
    },
    [sendDiscreteEvent]
  );

  const handleMomentaryCommand = useCallback(
    (tag: string) => {
      setState((prev) => ({ ...prev, lastCommandTag: tag }));
      sendDiscreteEvent(tag);
    },
    [sendDiscreteEvent]
  );

  const handleConnectPc = useCallback((overrideHost?: string) => {
    const s = stateRef.current;
    const hostToUse = (typeof overrideHost === 'string' ? overrideHost : s.pcHost).trim();
    if (wsRef.current) {
      manualOffRef.current = true;
      wsRef.current.close();
      wsRef.current = null;
      setState((prev) => ({
        ...prev,
        wsConnected: false,
        lastCommandTag: 'DISCONNECTED · 已切回本地仿真模式',
      }));
      return;
    }

    manualOffRef.current = false;
    try {
      const url = `ws://${hostToUse}:${s.pcPort.trim()}`;
      setState((prev) => ({
        ...prev,
        pcHost: hostToUse,
        lastCommandTag: `CONNECTING · 正在连接 ${url}...`,
      }));
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        setState((prev) => ({
          ...prev,
          wsConnected: true,
          lastCommandTag: `ONLINE · 已连接 PC 伴侣 (${hostToUse})`,
        }));
      };

      ws.onmessage = (msg) => {
        try {
          const data = JSON.parse(String(msg.data));
          if (data.type === 'telemetry' && gameModeRef.current === 'ets2') {
            setState((prev) => ({
              ...prev,
              speedKmh: data.speedKmh ?? prev.speedKmh,
              rpm: data.rpm ?? prev.rpm,
              gearDisplay: data.gearDisplay ?? prev.gearDisplay,
              fuelRatio: data.fuelRatio ?? prev.fuelRatio,
              airPressureBar: data.airPressureBar ?? prev.airPressureBar,
            }));
          }
        } catch {
          // Ignore malformed packet
        }
      };

      ws.onerror = () => {
        setState((prev) => ({
          ...prev,
          wsConnected: false,
          lastCommandTag: 'PC 未启动服务 · 当前可在本地试驾体验全部摇杆与宏',
        }));
      };

      ws.onclose = () => {
        wsRef.current = null;
        setState((prev) => ({ ...prev, wsConnected: false }));
      };
    } catch {
      setState((prev) => ({
        ...prev,
        wsConnected: false,
        lastCommandTag: '地址格式错误 · 请输入局域网电脑 IP',
      }));
    }
  }, []);

  const handleAutoDiscoverPc = useCallback(async () => {
    if (scanningPc) return;
    setScanningPc(true);
    setState((prev) => ({
      ...prev,
      lastCommandTag: 'LAN SCAN · 正在扫描同一 Wi-Fi 下的电脑端伴侣...',
    }));
    const foundIp = await discoverPcCompanion(stateRef.current.pcHost, stateRef.current.pcPort);
    setScanningPc(false);
    if (foundIp) {
      CockpitHaptics.heavyClunk();
      handleConnectPc(foundIp);
    } else {
      setState((prev) => ({
        ...prev,
        lastCommandTag: '未搜到电脑端 · 请确认电脑已打开程序且在同一 Wi-Fi，或手动输入 IP',
      }));
    }
  }, [handleConnectPc, scanningPc]);

  // Native iOS/Android .ipa/.apk: silently auto-discover PC companion on Wi-Fi launch
  useEffect(() => {
    if (Platform.OS === 'web') return;
    let cancelled = false;
    discoverPcCompanion(stateRef.current.pcHost, stateRef.current.pcPort).then((ip) => {
      if (!cancelled && ip && !wsRef.current) {
        handleConnectPc(ip);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [handleConnectPc]);

  useEffect(() => {
    if (!HOSTED_BY_PC) return;
    const t = setInterval(() => {
      if (!wsRef.current && !manualOffRef.current) handleConnectPc();
    }, 2500);
    return () => clearInterval(t);
  }, [handleConnectPc]);

  // Shared & Mode-Aware Callbacks
  const handleSteeringChange = useCallback((angleDeg: number) => {
    setState((prev) =>
      Math.abs(prev.steeringAngle - angleDeg) < 0.05
        ? prev
        : { ...prev, steeringAngle: angleDeg }
    );
  }, []);

  const handleTurnSignalChange = useCallback(
    (next: TurnSignalState, tag?: string) => {
      if (gameModeRef.current === 'fs25') {
        const prevTurn = fsRef.current.turnSignal;
        setFs((prev) => ({ ...prev, turnSignal: next }));
        if (next === -1) handleFsAction('blinker_left', 'BLINKER L [Num1] · 左转向灯开启');
        else if (next === 1) handleFsAction('blinker_right', 'BLINKER R [Num3] · 右转向灯开启');
        else if (prevTurn !== 0) {
          handleFsAction(
            prevTurn === -1 ? 'blinker_left' : 'blinker_right',
            'BLINKER OFF · 转向灯回位关闭'
          );
        }
        return;
      }
      handlePatch({ turnSignal: next }, tag);
    },
    [handleFsAction, handlePatch]
  );

  const handleToggleHighBeam = useCallback(() => {
    if (gameModeRef.current === 'fs25') {
      const next = !fsRef.current.highBeam;
      setFs((prev) => ({ ...prev, highBeam: next }));
      handleFsAction('high_beam', `HIGH BEAM [Ctrl+F] · 远光灯${next ? '开启' : '关闭'}`);
      return;
    }
    setState((prev) => ({
      ...prev,
      highBeam: !prev.highBeam,
      lastCommandTag: `HIGH BEAM [K] · 远光灯${!prev.highBeam ? '开启' : '关闭'}`,
    }));
    sendDiscreteEvent('HIGH_BEAM_TOGGLE');
  }, [handleFsAction, sendDiscreteEvent]);

  const handleFlashHighBeam = useCallback(
    (down: boolean) => {
      if (gameModeRef.current === 'fs25') {
        if (down) handleFsAction('lights_cycle', 'LIGHTS [F] · 切换农机工作灯');
        return;
      }
      setState((prev) => ({
        ...prev,
        flashHighBeam: down,
        ...(down ? { lastCommandTag: 'LIGHT HORN [J] · 闪远光示意' } : {}),
      }));
    },
    [handleFsAction]
  );

  const handleRetarderChange = useCallback(
    (level: number) => {
      if (gameModeRef.current === 'fs25') {
        const wantLower = level > 0;
        if (wantLower !== fsRef.current.toolLowered) {
          setFs((prev) => ({ ...prev, toolLowered: wantLower }));
          handleFsAction('lower_tool', `LIFT STALK [V] · 农具${wantLower ? '降下' : '抬起'}`);
        }
        return;
      }
      handlePatch(
        { retarderLevel: level },
        level === 0 ? 'RETARDER OFF · 液力缓速器关闭' : `RETARDER R${level} · 液力缓速器 ${level} 档`
      );
    },
    [handleFsAction, handlePatch]
  );

  const handleToggleExhaustBrake = useCallback(() => {
    if (gameModeRef.current === 'fs25') {
      const next = !fsRef.current.ptoActive;
      setFs((prev) => ({ ...prev, ptoActive: next }));
      handleFsAction('turn_on_tool', `PTO [B] · 农具动力输出${next ? '启动' : '关闭'}`);
      return;
    }
    setState((prev) => ({
      ...prev,
      exhaustBrake: !prev.exhaustBrake,
      lastCommandTag: `EXHAUST BRAKE [B] · 排气制动${!prev.exhaustBrake ? '开启' : '关闭'}`,
    }));
  }, [handleFsAction]);

  const handleHornChange = useCallback((down: boolean, air: boolean) => {
    CockpitSounds.setHorn(down, air);
    if (gameModeRef.current === 'fs25') {
      setFs((prev) => ({ ...prev, horn: down }));
      if (down) {
        setState((prev) => ({ ...prev, lastCommandTag: 'HORN [0] · 农机气喇叭鸣笛' }));
      }
      return;
    }
    if (air) {
      setState((prev) => ({
        ...prev,
        airHorn: down,
        ...(down ? { lastCommandTag: 'AIR HORN [N] · 车顶气喇叭鸣笛' } : {}),
      }));
    } else {
      setState((prev) => ({
        ...prev,
        horn: down,
        ...(down ? { lastCommandTag: 'HORN [H] · 方向盘电喇叭' } : {}),
      }));
    }
  }, []);

  const handleFsHornHold = useCallback((down: boolean) => {
    CockpitSounds.setHorn(down, false);
    setFs((prev) => ({ ...prev, horn: down }));
    if (down) {
      setState((prev) => ({ ...prev, lastCommandTag: 'HORN [0] · 农机喇叭鸣笛' }));
    }
  }, []);

  const handleToggleSound = useCallback(() => {
    setState((prev) => {
      const next = !prev.soundEnabled;
      CockpitSounds.setEnabled(next);
      if (next) CockpitHaptics.switchClick();
      return {
        ...prev,
        soundEnabled: next,
        lastCommandTag: next ? 'SOUND ON · 真车座舱音效已开启' : 'MUTED · 座舱音效已静音',
      };
    });
  }, []);

  const handleCruiseToggle = useCallback(() => {
    if (gameModeRef.current === 'fs25') {
      const next = !fsRef.current.cruiseEnabled;
      setFs((prev) => ({ ...prev, cruiseEnabled: next }));
      handleFsAction(
        'cruise_toggle',
        next
          ? `CRUISE [3] · 农机定速锁定 ${fsRef.current.cruiseTargetKmh} km/h`
          : 'CRUISE [3] · 取消田间定速'
      );
      return;
    }
    setState((prev) => {
      const next = !prev.cruiseEnabled;
      const targetSpd = next
        ? Math.max(30, Math.round(prev.speedKmh || prev.cruiseSpeedKmh))
        : prev.cruiseSpeedKmh;
      return {
        ...prev,
        cruiseEnabled: next,
        cruiseSpeedKmh: targetSpd,
        lastCommandTag: next ? `CRUISE [C] · 定速巡航锁定 ${targetSpd} km/h` : 'CRUISE OFF · 取消巡航',
      };
    });
  }, [handleFsAction]);

  const handleCruiseAdjust = useCallback(
    (delta: number) => {
      if (gameModeRef.current === 'fs25') {
        const cur = fsRef.current.cruiseTargetKmh;
        const next = Math.max(1, Math.min(53, cur + delta));
        const steps = Math.abs(next - cur);
        setFs((prev) => ({ ...prev, cruiseTargetKmh: next }));
        if (steps > 0) {
          handleFsAction(
            delta > 0 ? 'cruise_up' : 'cruise_down',
            `CRUISE [${delta > 0 ? '2' : '1'}] · 目标 ${next} km/h`,
            { times: steps }
          );
        }
        return;
      }
      setState((prev) => {
        const nextSpd = Math.max(30, Math.min(110, prev.cruiseSpeedKmh + delta));
        return {
          ...prev,
          cruiseSpeedKmh: nextSpd,
          lastCommandTag: `CRUISE SET · 巡航目标 ${nextSpd} km/h`,
        };
      });
    },
    [handleFsAction]
  );

  const handleSelectDrive = useCallback(
    (d: DriveSelector) => {
      if (gameModeRef.current === 'fs25') {
        const targetShuttle = d === 'D' ? 'F' : d === 'R' ? 'R' : 'N';
        const prevShuttle = fsRef.current.shuttleDir;
        setFs((prev) => ({ ...prev, shuttleDir: targetShuttle }));
        if (
          (targetShuttle === 'F' && prevShuttle === 'R') ||
          (targetShuttle === 'R' && prevShuttle !== 'R')
        ) {
          handleFsAction(
            'direction_change',
            `SHUTTLE [Space] · 农机换向挂入 ${targetShuttle === 'R' ? 'R 倒车' : 'F 前进'}`
          );
        } else {
          setState((prev) => ({ ...prev, lastCommandTag: 'SHUTTLE · 空挡待命' }));
        }
        return;
      }
      handlePatch(
        { driveSelector: d },
        `SHIFTER · 挂入 ${d === 'D' ? 'D 前进挡' : d === 'R' ? 'R 倒车挡' : 'N 空挡'}`
      );
    },
    [handleFsAction, handlePatch]
  );

  const handleShiftStep = useCallback(
    (delta: 1 | -1) => {
      if (gameModeRef.current === 'fs25') {
        handleFsAction(
          delta > 0 ? 'gear_up' : 'gear_down',
          `GEAR [${delta > 0 ? 'Num+' : 'Num-'}] · 农机手动${delta > 0 ? '加档' : '减档'}`
        );
        return;
      }
      manualGearNumRef.current = Math.max(1, Math.min(12, manualGearNumRef.current + delta));
      const g = manualGearNumRef.current;
      setState((prev) => ({
        ...prev,
        manualSequential: true,
        gearDisplay: prev.driveSelector === 'D' ? `M${g}` : prev.gearDisplay,
        lastCommandTag: `SEQ SHIFT · 序列手动 M${g} 档`,
      }));
    },
    [handleFsAction]
  );

  const handleThrottleChange = useCallback((val: number) => {
    setState((prev) => {
      const warnTag =
        gameModeRef.current === 'ets2' &&
        val > 0.25 &&
        prev.parkingBrake &&
        prev.driveSelector !== 'N'
          ? '提示：请点刹车下方 (P) 或在底盘舱松开手刹起步'
          : prev.lastCommandTag;
      return { ...prev, throttle: val, lastCommandTag: warnTag };
    });
  }, []);

  const handleToggleThrottleLock = useCallback(() => {
    setState((prev) => {
      const next = !prev.throttleLocked;
      return {
        ...prev,
        throttleLocked: next,
        throttle: next ? Math.max(0.45, prev.throttle) : 0,
        lastCommandTag: next ? 'THROTTLE HOLD · 手油门恒定锁定' : 'THROTTLE RELEASE · 油门恢复回弹',
      };
    });
  }, []);

  const handleBrakeChange = useCallback((val: number) => {
    setState((prev) => ({
      ...prev,
      brake: val,
      ...(val > 0.1 && prev.throttleLocked ? { throttleLocked: false, throttle: 0 } : {}),
    }));
  }, []);

  const handleToggleParkingBrake = useCallback(() => {
    setState((prev) => ({
      ...prev,
      parkingBrake: !prev.parkingBrake,
      lastCommandTag: `PARKING BRAKE · 驻车制动${!prev.parkingBrake ? '拉起' : '松开'}`,
    }));
  }, []);

  // FS25 Specific Joystick & CommandARM Callbacks
  const handleLoaderMove = useCallback((lx: number, ly: number) => {
    setFs((prev) =>
      Math.abs(prev.loaderX - lx) < 0.01 && Math.abs(prev.loaderY - ly) < 0.01
        ? prev
        : { ...prev, loaderX: lx, loaderY: ly }
    );
  }, []);

  const handleSteeringLockChange = useCallback((deg: SteeringLockRange) => {
    setState((prev) => ({
      ...prev,
      steeringLock: deg,
      steeringAngle: Math.max(-deg / 2, Math.min(deg / 2, prev.steeringAngle)),
      lastCommandTag: `LOCK · 方向盘转向角设为 ${deg}°`,
    }));
  }, []);

  const handleLookChange = useCallback((yaw: number, autoCenter?: boolean, tag?: string) => {
    setState((prev) => ({
      ...prev,
      lookYaw: yaw,
      ...(autoCenter !== undefined ? { lookAutoCenter: autoCenter } : {}),
      ...(tag ? { lastCommandTag: tag } : {}),
    }));
  }, []);

  // ======== RENDER COCKPIT BY ACTIVE GAME MODE ========
  const cockpitContent =
    gameMode === 'fs25' ? (
      <View style={styles.cockpitFrame}>
        {fs.layout === 'sidepanel' ? (
          <HydraulicJoystickPod
            loaderX={fs.loaderX}
            loaderY={fs.loaderY}
            loaderAux={fs.loaderAux}
            loaderMode={fs.loaderMode}
            simBoomHeight={fs.simBoomHeight}
            simBucketTilt={fs.simBucketTilt}
            activeToolSlot={fs.activeToolSlot}
            onLoaderMove={handleLoaderMove}
            onToggleAux={() =>
              handleFsPatch(
                { loaderAux: !fs.loaderAux },
                !fs.loaderAux
                  ? 'HYD 2ND [Shift] · 切换为第2油路（伸缩臂 / 林业抓木爪）'
                  : 'HYD 1ST · 切回主油路（前装载机大臂升降 / 铲斗翻转）'
              )
            }
            onToggleMode={() =>
              handleFsPatch(
                { loaderMode: fs.loaderMode === 'keys' ? 'analog' : 'keys' },
                fs.loaderMode === 'keys'
                  ? 'LOADER ANALOG · 已切换为虚拟手柄右摇杆无级比例轴'
                  : 'LOADER KEYS · 已切换为免设置 J/N/K/M 键盘液压阀'
              )
            }
            onSwitchTool={() => {
              const nextSlot = (fs.activeToolSlot + 1) % FS25_TOOL_SLOTS.length;
              handleFsPatch({ activeToolSlot: nextSlot });
              handleFsAction('switch_tool', `TOOL [G] · 切换至 ${FS25_TOOL_SLOTS[nextSlot]}`);
            }}
            onAttachTool={() =>
              handleFsAction('attach', 'ATTACH [Q] · 挂接 / 脱钩农具与动力输出轴')
            }
          />
        ) : (
          <SteeringColumn
            steeringAngle={state.steeringAngle}
            steeringLock={state.steeringLock}
            steeringSensitivity={state.steeringSensitivity}
            speedKmh={fs.speedKmh}
            turnSignal={fs.turnSignal}
            blinkerPhaseOn={state.blinkerPhaseOn}
            highBeam={fs.highBeam}
            retarderLevel={fs.toolLowered ? 2 : 0}
            exhaustBrake={fs.ptoActive}
            cruiseEnabled={fs.cruiseEnabled}
            cruiseSpeedKmh={fs.cruiseTargetKmh}
            brandTitle="VARIO"
            brandSub="TRACTOR"
            accentColor="#15803d"
            onSteeringChange={handleSteeringChange}
            onTurnSignalChange={handleTurnSignalChange}
            onToggleHighBeam={handleToggleHighBeam}
            onFlashHighBeam={handleFlashHighBeam}
            onRetarderChange={handleRetarderChange}
            onToggleExhaustBrake={handleToggleExhaustBrake}
            onHornChange={handleHornChange}
            onCruiseToggle={handleCruiseToggle}
            onCruiseAdjust={handleCruiseAdjust}
          />
        )}

        <View style={styles.centerColumn}>
          <TractorMFD
            fs={fs}
            steeringAngle={state.steeringAngle}
            blinkerPhaseOn={state.blinkerPhaseOn}
            wsConnected={state.wsConnected}
            soundEnabled={state.soundEnabled}
            lastCommandTag={state.lastCommandTag}
            onSwitchToEts2={() => setGarageOpen(true)}
            onToggleLayout={() =>
              handleFsPatch(
                { layout: fs.layout === 'sidepanel' ? 'full' : 'sidepanel' },
                fs.layout === 'sidepanel'
                  ? 'FULL COCKPIT · 已开启全触屏方向盘+踏板驾驶模式'
                  : 'SIDE PANEL · 已切回农机专用大摇杆副驾扶手台'
              )
            }
            onPressLinkBadge={() => setFsBay(3)}
            onToggleSound={handleToggleSound}
            onToggleTurnSignal={(dir) =>
              handleTurnSignalChange(fs.turnSignal === dir ? 0 : dir)
            }
          />
          <Fs25ConsoleDeck
            fs={fs}
            activeBay={fsBay}
            steeringLock={state.steeringLock}
            steeringAngle={state.steeringAngle}
            lookYaw={state.lookYaw}
            lookAutoCenter={state.lookAutoCenter}
            blinkerPhaseOn={state.blinkerPhaseOn}
            pcHost={state.pcHost}
            wsConnected={state.wsConnected}
            soundEnabled={state.soundEnabled}
            onBayChange={setFsBay}
            onFsPatch={handleFsPatch}
            onFsAction={handleFsAction}
            onHeadlandEnter={handleHeadlandEnter}
            onHeadlandExit={handleHeadlandExit}
            onLoaderHoldAxis={handleLoaderMove}
            onHornHold={handleFsHornHold}
            onSteeringLockChange={handleSteeringLockChange}
            onLookChange={handleLookChange}
            onPcHostChange={(txt) => setState((prev) => ({ ...prev, pcHost: txt }))}
            onConnectPc={() => handleConnectPc()}
            onAutoDiscoverPc={handleAutoDiscoverPc}
            scanningPc={scanningPc}
            onToggleSound={handleToggleSound}
          />
        </View>

        {fs.layout === 'sidepanel' ? (
          <Fs25RightCommandPod
            cruiseEnabled={fs.cruiseEnabled}
            cruiseTargetKmh={fs.cruiseTargetKmh}
            toolLowered={fs.toolLowered}
            ptoActive={fs.ptoActive}
            shuttleDir={fs.shuttleDir}
            onHeadlandEnter={handleHeadlandEnter}
            onHeadlandExit={handleHeadlandExit}
            onCruiseToggle={handleCruiseToggle}
            onCruiseStep={handleCruiseAdjust}
            onLowerTool={() => {
              const next = !fs.toolLowered;
              handleFsPatch({ toolLowered: next });
              handleFsAction('lower_tool', `LIFT [V] · 当前农具${next ? '降下入土' : '抬起'}`);
            }}
            onTogglePto={() => {
              const next = !fs.ptoActive;
              handleFsPatch({ ptoActive: next });
              handleFsAction('turn_on_tool', `PTO [B] · 农具动力轴${next ? '启动' : '停止'}`);
            }}
            onShuttleReverse={() => {
              const next = fs.shuttleDir === 'R' ? 'F' : 'R';
              handleFsPatch({ shuttleDir: next });
              handleFsAction(
                'direction_change',
                `SHUTTLE [Space] · 换向梭挡切至 ${next === 'R' ? 'R 倒退' : 'F 前进'}`
              );
            }}
          />
        ) : (
          <PedalShifterZone
            driveSelector={fs.shuttleDir === 'F' ? 'D' : fs.shuttleDir}
            gearDisplay={fs.shuttleDir}
            manualSequential={true}
            throttle={state.throttle}
            throttleLocked={state.throttleLocked}
            brake={state.brake}
            parkingBrake={state.parkingBrake}
            onSelectDrive={handleSelectDrive}
            onShiftStep={handleShiftStep}
            onThrottleChange={handleThrottleChange}
            onToggleThrottleLock={handleToggleThrottleLock}
            onBrakeChange={handleBrakeChange}
            onToggleParkingBrake={handleToggleParkingBrake}
          />
        )}
      </View>
    ) : (
      <View style={styles.cockpitFrame}>
        <SteeringColumn
          steeringAngle={state.steeringAngle}
          steeringLock={state.steeringLock}
          steeringSensitivity={state.steeringSensitivity}
          speedKmh={state.speedKmh}
          turnSignal={state.turnSignal}
          blinkerPhaseOn={state.blinkerPhaseOn}
          highBeam={state.highBeam || state.flashHighBeam}
          retarderLevel={state.retarderLevel}
          exhaustBrake={state.exhaustBrake}
          cruiseEnabled={state.cruiseEnabled}
          cruiseSpeedKmh={state.cruiseSpeedKmh}
          onSteeringChange={handleSteeringChange}
          onTurnSignalChange={handleTurnSignalChange}
          onToggleHighBeam={handleToggleHighBeam}
          onFlashHighBeam={handleFlashHighBeam}
          onRetarderChange={handleRetarderChange}
          onToggleExhaustBrake={handleToggleExhaustBrake}
          onHornChange={handleHornChange}
          onCruiseToggle={handleCruiseToggle}
          onCruiseAdjust={handleCruiseAdjust}
        />

        <View style={styles.centerColumn}>
          <DigitalMFD
            state={state}
            onPressLinkBadge={() => setActiveBay(3)}
            onToggleSound={handleToggleSound}
            onSwitchToFs25={() => setGarageOpen(true)}
            onToggleTurnSignal={(dir) =>
              handleTurnSignalChange(
                state.turnSignal === dir ? 0 : dir,
                dir === -1 ? 'LEFT TURN · 左转向灯' : 'RIGHT TURN · 右转向灯'
              )
            }
          />
          <CenterConsoleDeck
            state={state}
            activeBay={activeBay}
            onBayChange={setActiveBay}
            onPatch={handlePatch}
            onMomentaryCommand={handleMomentaryCommand}
            onConnectPc={() => handleConnectPc()}
            onAutoDiscoverPc={handleAutoDiscoverPc}
            scanningPc={scanningPc}
          />
        </View>

        <PedalShifterZone
          driveSelector={state.driveSelector}
          gearDisplay={state.gearDisplay}
          manualSequential={state.manualSequential}
          throttle={state.throttle}
          throttleLocked={state.throttleLocked}
          brake={state.brake}
          parkingBrake={state.parkingBrake}
          onSelectDrive={handleSelectDrive}
          onShiftStep={handleShiftStep}
          onThrottleChange={handleThrottleChange}
          onToggleThrottleLock={handleToggleThrottleLock}
          onBrakeChange={handleBrakeChange}
          onToggleParkingBrake={handleToggleParkingBrake}
        />
      </View>
    );

  const unifiedShell = (
    <View style={{ flex: 1, position: 'relative' }}>
      {cockpitContent}
      <CockpitGarageModal
        visible={garageOpen}
        currentGame={gameMode}
        currentFsLayout={fs.layout}
        wsConnected={state.wsConnected}
        onSelectEts2={() => {
          switchGameMode('ets2');
          setGarageOpen(false);
        }}
        onSelectFs25={(layout) => {
          switchGameMode('fs25');
          handleFsPatch(
            { layout },
            layout === 'sidepanel'
              ? 'FS25 农机侧台模式已就绪 · 搭配电脑键鼠/方向盘操控液压与农具'
              : 'FS25 全触屏驾驶座舱已就绪 · 方向盘+踏板+农具全接管'
          );
          setGarageOpen(false);
        }}
        onClose={() => setGarageOpen(false)}
      />
    </View>
  );

  // Desktop Web iPhone Simulator Shell (only on wide desktop browsers, never on real mobile screens)
  const isDesktopBrowser = Platform.OS === 'web' && winWidth >= 900 && winHeight >= 480;
  if (isDesktopBrowser && webSimDevice !== 'fullscreen') {
    const isProMax = webSimDevice === 'iphone16promax';
    const frameW = isProMax ? 932 : 852;
    const frameH = isProMax ? 430 : 393;
    const scale = Math.min(1, (winWidth - 48) / (frameW + 28), (winHeight - 76) / (frameH + 28));

    return (
      <View style={styles.simStage}>
        <View style={styles.simToolbar}>
          <Pressable
            onPress={() => {
              CockpitHaptics.tick();
              setGarageOpen(true);
            }}
            style={[styles.simBtn, garageOpen && styles.simBtnActive]}
          >
            <Text style={[styles.simBtnTxt, garageOpen && styles.simBtnTxtActive]}>
              ⊞ 座舱大厅
            </Text>
          </Pressable>
          <Pressable
            onPress={() => {
              CockpitHaptics.switchClick();
              switchGameMode('fs25');
              setGarageOpen(false);
            }}
            style={[styles.simBtn, !garageOpen && gameMode === 'fs25' && styles.simBtnFsActive]}
          >
            <Text
              style={[
                styles.simBtnTxt,
                !garageOpen && gameMode === 'fs25' && styles.simBtnTxtActive,
              ]}
            >
              🚜 农场模拟 2025
            </Text>
          </Pressable>
          <Pressable
            onPress={() => {
              CockpitHaptics.switchClick();
              switchGameMode('ets2');
              setGarageOpen(false);
            }}
            style={[styles.simBtn, !garageOpen && gameMode === 'ets2' && styles.simBtnEtsActive]}
          >
            <Text
              style={[
                styles.simBtnTxt,
                !garageOpen && gameMode === 'ets2' && styles.simBtnTxtActive,
              ]}
            >
              🚛 欧洲卡车模拟 2
            </Text>
          </Pressable>

          <View style={styles.toolbarDivider} />

          {(
            [
              { id: 'iphone16pro', label: 'iPhone 16 Pro (852×393)' },
              { id: 'iphone16promax', label: '16 Pro Max (932×430)' },
              { id: 'fullscreen', label: '铺满网页' },
            ] as const
          ).map((opt) => {
            const active = webSimDevice === opt.id;
            return (
              <Pressable
                key={opt.id}
                onPress={() => {
                  CockpitHaptics.tick();
                  setWebSimDevice(opt.id);
                }}
                style={[styles.simBtn, active && styles.simBtnActive]}
              >
                <Text style={[styles.simBtnTxt, active && styles.simBtnTxtActive]}>
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View
          style={[
            styles.iphoneTitaniumFrame,
            {
              width: frameW + 24,
              height: frameH + 24,
              transform: [{ scale }],
            },
          ]}
        >
          <View style={styles.hwBtnAction} />
          <View style={styles.hwBtnVolUp} />
          <View style={styles.hwBtnVolDown} />
          <View style={styles.hwBtnPower} />

          <View style={[styles.iphoneScreen, { width: frameW, height: frameH }]}>
            <View style={styles.iphoneSafeInner}>{unifiedShell}</View>

            <View pointerEvents="none" style={styles.dynamicIsland}>
              <View style={styles.faceIdSensor} />
              <View style={styles.frontCamLens} />
            </View>

            <View pointerEvents="none" style={styles.homeIndicatorWrap}>
              <View style={styles.homeIndicatorBar} />
            </View>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.safeRoot,
        {
          paddingTop: insets.top,
          paddingBottom: Math.min(insets.bottom, 10),
          paddingLeft: insets.left,
          paddingRight: insets.right,
        },
      ]}
    >
      <StatusBar hidden />
      {isDesktopBrowser && (
        <Pressable
          onPress={() => setWebSimDevice('iphone16pro')}
          style={styles.floatingReopenSim}
        >
          <Text style={styles.floatingReopenTxt}>📱 切回 iPhone 预览框</Text>
        </Pressable>
      )}
      {unifiedShell}
    </View>
  );
}

const styles = StyleSheet.create({
  safeRoot: {
    flex: 1,
    backgroundColor: CockpitTheme.bgRoot,
  },
  cockpitFrame: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: CockpitTheme.dashSurface,
  },
  centerColumn: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 4,
    paddingVertical: 8,
    gap: 8,
    backgroundColor: CockpitTheme.dashSurface,
  },
  simStage: {
    flex: 1,
    backgroundColor: '#dde5ef',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 10,
  },
  simToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    gap: 7,
    zIndex: 20,
  },
  toolbarDivider: {
    width: 1,
    height: 16,
    backgroundColor: '#cbd5e1',
    marginHorizontal: 2,
  },
  simBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: 999,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  simBtnActive: {
    backgroundColor: '#0284c7',
    borderColor: '#0369a1',
  },
  simBtnFsActive: {
    backgroundColor: '#15803d',
    borderColor: '#166534',
  },
  simBtnEtsActive: {
    backgroundColor: '#ea580c',
    borderColor: '#c2410c',
  },
  simBtnTxt: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#475569',
  },
  simBtnTxtActive: {
    color: '#ffffff',
  },
  iphoneTitaniumFrame: {
    backgroundColor: '#cbd5e1',
    borderRadius: 56,
    borderWidth: 3.5,
    borderColor: '#94a3b8',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#334155',
    shadowOpacity: 0.28,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
  },
  iphoneScreen: {
    backgroundColor: CockpitTheme.dashOuter,
    borderRadius: 46,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 2,
    borderColor: '#475569',
  },
  iphoneSafeInner: {
    flex: 1,
    paddingLeft: 44,
    paddingRight: 16,
    paddingBottom: 12,
    backgroundColor: CockpitTheme.dashOuter,
  },
  dynamicIsland: {
    position: 'absolute',
    left: 11,
    top: '50%',
    marginTop: -56,
    width: 28,
    height: 112,
    borderRadius: 16,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
  },
  faceIdSensor: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#334155',
  },
  frontCamLens: {
    width: 11,
    height: 11,
    borderRadius: 5.5,
    backgroundColor: '#0f172a',
    borderWidth: 1.5,
    borderColor: '#0284c7',
  },
  homeIndicatorWrap: {
    position: 'absolute',
    bottom: 4,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  homeIndicatorBar: {
    width: 134,
    height: 4.5,
    borderRadius: 3,
    backgroundColor: 'rgba(15, 23, 42, 0.28)',
  },
  hwBtnAction: {
    position: 'absolute',
    top: -5,
    left: 130,
    width: 28,
    height: 3,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
    backgroundColor: '#a89f91',
  },
  hwBtnVolUp: {
    position: 'absolute',
    top: -5,
    left: 178,
    width: 50,
    height: 3,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
    backgroundColor: '#a89f91',
  },
  hwBtnVolDown: {
    position: 'absolute',
    top: -5,
    left: 238,
    width: 50,
    height: 3,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
    backgroundColor: '#a89f91',
  },
  hwBtnPower: {
    position: 'absolute',
    bottom: -5,
    left: 210,
    width: 68,
    height: 3,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
    backgroundColor: '#a89f91',
  },
  floatingReopenSim: {
    position: 'absolute',
    top: 6,
    right: 12,
    zIndex: 50,
    backgroundColor: 'rgba(15, 23, 42, 0.82)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  floatingReopenTxt: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#ffffff',
  },
});
