export type HeadlightMode = 0 | 1 | 2; // 0: OFF, 1: Parking/Side, 2: Low Beam
export type WiperMode = 0 | 1 | 2 | 3; // 0: OFF, 1: Intermittent, 2: Low, 3: High
export type TurnSignalState = -1 | 0 | 1; // -1: Left, 0: Off, 1: Right
export type DriveSelector = 'R' | 'N' | 'D';
export type DrivePowerMode = 0 | 1 | 2; // 0: ECO, 1: NORMAL, 2: POWER
export type SteeringLockRange = 900 | 1800;

export interface TruckControllerState {
  // Continuous Axes
  steeringAngle: number;        // -450..+450 or -900..+900 deg
  steeringLock: SteeringLockRange;
  steeringSensitivity: number;  // 0.5 .. 1.5
  throttle: number;             // 0..1
  throttleLocked: boolean;      // Highway foot-off hold
  brake: number;                // 0..1
  lookYaw: number;              // -1..+1 cabin freelook swipe pad
  lookAutoCenter: boolean;

  // Shifter & Gearbox
  driveSelector: DriveSelector;
  manualSequential: boolean;    // false = Real Auto, true = Sequential
  rangeHigh: boolean;           // Range-Splitter High/Low
  splitterHigh: boolean;        // Half-gear Split High/Low
  drivePowerMode: DrivePowerMode;

  // Column Stalks & Wheel Thumb Controls
  turnSignal: TurnSignalState;
  highBeam: boolean;
  flashHighBeam: boolean;       // Momentary light horn
  retarderLevel: number;        // 0..5 stages
  exhaustBrake: boolean;
  cruiseEnabled: boolean;
  cruiseSpeedKmh: number;
  horn: boolean;
  airHorn: boolean;

  // Bay 1: Lighting & Vision
  headlightMode: HeadlightMode;
  frontFog: boolean;
  roofAuxLights: boolean;
  frontGrillLights: boolean;
  beacon: boolean;
  hazardLights: boolean;
  wiperMode: WiperMode;

  // Bay 2: Drivetrain, Chassis & Trailer
  ignitionOn: boolean;
  engineRunning: boolean;
  parkingBrake: boolean;
  diffLock: boolean;
  truckLiftAxle: boolean;
  trailerLiftAxle: boolean;
  trailerAttached: boolean;
  frontSuspOffset: number;      // -100..+100 mm simulated indicator
  rearSuspOffset: number;       // -100..+100 mm

  // Bay 3: ADAS & Assist
  accDistanceStep: number;      // 1..4
  laneKeepAssist: boolean;
  hillHold: boolean;
  speedLimiter: boolean;

  // Bay 4: Cabin & Comfort
  leftWindowOpen: number;       // 0..100 %
  rightWindowOpen: number;      // 0..100 %
  dashBacklight: number;        // 0.3..1.0
  activeCamera: number;         // 1: Interior, 2: Chase, 3: Top, 5: Lean Back, 6: Bumper
  radioPlaying: boolean;
  radioStation: number;

  // Telemetry (either from PC ETS2 SDK or Built-in Offline Test Simulator)
  speedKmh: number;
  rpm: number;
  gearDisplay: string;          // e.g. 'A12', 'C1', 'N', 'R1'
  fuelRatio: number;            // 0..1
  airPressureBar: number;       // 0..12 bar
  blinkerPhaseOn: boolean;      // 1.5Hz flasher relay tick

  // PC Link Configuration
  soundEnabled: boolean;
  pcHost: string;
  pcPort: string;
  wsConnected: boolean;
  offlineSimEnabled: boolean;
  lastCommandTag: string;       // Visual feedback of triggered ETS2 binding
}

export const INITIAL_TRUCK_STATE: TruckControllerState = {
  steeringAngle: 0,
  steeringLock: 900,
  steeringSensitivity: 1.0,
  throttle: 0,
  throttleLocked: false,
  brake: 0,
  lookYaw: 0,
  lookAutoCenter: true,

  driveSelector: 'N',
  manualSequential: false,
  rangeHigh: false,
  splitterHigh: false,
  drivePowerMode: 1,

  turnSignal: 0,
  highBeam: false,
  flashHighBeam: false,
  retarderLevel: 0,
  exhaustBrake: false,
  cruiseEnabled: false,
  cruiseSpeedKmh: 80,
  horn: false,
  airHorn: false,

  headlightMode: 2,
  frontFog: false,
  roofAuxLights: false,
  frontGrillLights: false,
  beacon: false,
  hazardLights: false,
  wiperMode: 0,

  ignitionOn: true,
  engineRunning: true,
  parkingBrake: true,
  diffLock: false,
  truckLiftAxle: false,
  trailerLiftAxle: false,
  trailerAttached: true,
  frontSuspOffset: 0,
  rearSuspOffset: 0,

  accDistanceStep: 2,
  laneKeepAssist: false,
  hillHold: true,
  speedLimiter: true,

  leftWindowOpen: 0,
  rightWindowOpen: 0,
  dashBacklight: 0.9,
  activeCamera: 1,
  radioPlaying: false,
  radioStation: 1,

  speedKmh: 0,
  rpm: 600,
  gearDisplay: 'N',
  fuelRatio: 0.78,
  airPressureBar: 10.4,
  blinkerPhaseOn: true,

  soundEnabled: true,
  pcHost: '192.168.3.30',
  pcPort: '8765',
  wsConnected: false,
  offlineSimEnabled: true,
  lastCommandTag: 'READY · 就绪',
};
