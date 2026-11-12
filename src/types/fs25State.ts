import { TurnSignalState } from './truckState';

export type GameCockpitMode = 'ets2' | 'fs25';
export type Fs25LayoutMode = 'sidepanel' | 'full';
export type Fs25LoaderAxisMode = 'keys' | 'analog';
export type Fs25ShuttleDir = 'F' | 'N' | 'R';

export const FS25_TOOL_SLOTS = ['前悬挂', '后农具', '拖挂车', '辅农具'] as const;

export interface Fs25ControllerState {
  layout: Fs25LayoutMode;

  // 2D Hydraulic Front-Loader / Telehandler / Forestry Crane Joystick (-1..+1)
  loaderX: number;
  loaderY: number;
  loaderAux: boolean; // false = Boom/Bucket (J/N/K/M), true = Telehandler/Grapple (Shift+J/N/K/M)
  loaderMode: Fs25LoaderAxisMode;
  simBoomHeight: number; // 0..100 % visual hydraulic feedback
  simBucketTilt: number; // -45..+45 deg visual tilt feedback

  // Implement & PTO Visual Status
  activeToolSlot: number; // 0..3
  toolLowered: boolean;
  ptoActive: boolean;
  toolUnfolded: boolean;
  pipeExtended: boolean;
  coverOpen: boolean;

  // Field Cruise, Native FS25 GPS Steering Assist & AI Worker
  cruiseEnabled: boolean;
  cruiseTargetKmh: number; // 1..53 km/h
  gpsActive: boolean;
  aiWorkerActive: boolean;
  itecWithPto: boolean;
  itecWithCruise: boolean;

  // Tractor Lights, Beacons & Signals
  lightStage: 0 | 1 | 2 | 3; // 0: Off, 1: Low Beam, 2: Rear Work, 3: All Work Lights
  highBeam: boolean;
  beacon: boolean;
  turnSignal: TurnSignalState;
  hazardLights: boolean;

  // Drivetrain & Offline Vario CVT Simulator
  engineRunning: boolean;
  shuttleDir: Fs25ShuttleDir;
  horn: boolean;
  speedKmh: number;
  rpm: number;
  fuelRatio: number;
}

export const INITIAL_FS25_STATE: Fs25ControllerState = {
  layout: 'sidepanel',

  loaderX: 0,
  loaderY: 0,
  loaderAux: false,
  loaderMode: 'keys',
  simBoomHeight: 35,
  simBucketTilt: 0,

  activeToolSlot: 1,
  toolLowered: false,
  ptoActive: false,
  toolUnfolded: true,
  pipeExtended: false,
  coverOpen: false,

  cruiseEnabled: false,
  cruiseTargetKmh: 16,
  gpsActive: false,
  aiWorkerActive: false,
  itecWithPto: true,
  itecWithCruise: true,

  lightStage: 1,
  highBeam: false,
  beacon: false,
  turnSignal: 0,
  hazardLights: false,

  engineRunning: true,
  shuttleDir: 'F',
  horn: false,
  speedKmh: 0,
  rpm: 820,
  fuelRatio: 0.86,
};
