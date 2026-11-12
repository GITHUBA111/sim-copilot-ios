import React from 'react';
import Svg, { Path, Circle, Line, Rect, G } from 'react-native-svg';

export type TruckIconName =
  | 'lowBeam'
  | 'highBeam'
  | 'parkingLight'
  | 'frontFog'
  | 'roofAux'
  | 'grillLight'
  | 'beacon'
  | 'hazard'
  | 'wiper'
  | 'washer'
  | 'engine'
  | 'ignition'
  | 'parkingBrake'
  | 'diffLock'
  | 'truckLiftAxle'
  | 'trailerLiftAxle'
  | 'trailerCouple'
  | 'suspUp'
  | 'suspDown'
  | 'suspReset'
  | 'exhaustBrake'
  | 'retarder'
  | 'cruise'
  | 'laneKeep'
  | 'hillHold'
  | 'speedLimit'
  | 'rangeGear'
  | 'splitGear'
  | 'windowL'
  | 'windowR'
  | 'camInterior'
  | 'camChase'
  | 'camMirror'
  | 'camLean'
  | 'info'
  | 'mapZoom'
  | 'advisor'
  | 'enterAct'
  | 'photo'
  | 'save'
  | 'tow'
  | 'horn'
  | 'tractor'
  | 'pto'
  | 'hitch'
  | 'implementLift'
  | 'implementAll'
  | 'unfold'
  | 'grainUnload'
  | 'pipeOut'
  | 'tarpCover'
  | 'gpsTrack'
  | 'aiWorker'
  | 'headlandIn'
  | 'headlandOut'
  | 'loaderArm'
  | 'shuttleFnr'
  | 'tensionBelt'
  | 'seedRefill'
  | 'shopBag'
  | 'workLight'
  | 'vehicleSwitch';

interface IconProps {
  name: TruckIconName;
  size?: number;
  color?: string;
}

export const TruckIcon: React.FC<IconProps> = ({
  name,
  size = 20,
  color = '#ff9d2e',
}) => {
  const s = 1.9;
  switch (name) {
    case 'lowBeam':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M11 6C15.5 6 19 8.7 19 12C19 15.3 15.5 18 11 18V6Z" stroke={color} strokeWidth={s} strokeLinejoin="round" />
          <Line x1="3" y1="9" x2="8.5" y2="11" stroke={color} strokeWidth={s} strokeLinecap="round" />
          <Line x1="3" y1="13" x2="8.5" y2="15" stroke={color} strokeWidth={s} strokeLinecap="round" />
          <Line x1="3" y1="17" x2="8.5" y2="19" stroke={color} strokeWidth={s} strokeLinecap="round" />
        </Svg>
      );
    case 'highBeam':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M11 6C15.5 6 19 8.7 19 12C19 15.3 15.5 18 11 18V6Z" stroke={color} strokeWidth={s} strokeLinejoin="round" />
          <Line x1="3" y1="8" x2="8.5" y2="8" stroke={color} strokeWidth={s} strokeLinecap="round" />
          <Line x1="3" y1="12" x2="8.5" y2="12" stroke={color} strokeWidth={s} strokeLinecap="round" />
          <Line x1="3" y1="16" x2="8.5" y2="16" stroke={color} strokeWidth={s} strokeLinecap="round" />
        </Svg>
      );
    case 'parkingLight':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M9 8C6.5 8 5 9.8 5 12C5 14.2 6.5 16 9 16V8Z" stroke={color} strokeWidth={s} />
          <Path d="M15 8C17.5 8 19 9.8 19 12C19 14.2 17.5 16 15 16V8Z" stroke={color} strokeWidth={s} />
          <Line x1="2" y1="9" x2="3.5" y2="10" stroke={color} strokeWidth={s} strokeLinecap="round" />
          <Line x1="2" y1="15" x2="3.5" y2="14" stroke={color} strokeWidth={s} strokeLinecap="round" />
          <Line x1="22" y1="9" x2="20.5" y2="10" stroke={color} strokeWidth={s} strokeLinecap="round" />
          <Line x1="22" y1="15" x2="20.5" y2="14" stroke={color} strokeWidth={s} strokeLinecap="round" />
        </Svg>
      );
    case 'frontFog':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M12 6C16 6 19 8.7 19 12C19 15.3 16 18 12 18V6Z" stroke={color} strokeWidth={s} />
          <Path d="M6.5 6C5.5 8 7.5 10 6.5 12C5.5 14 7.5 16 6.5 18" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
          <Line x1="2.5" y1="10" x2="9.5" y2="12.5" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
          <Line x1="2.5" y1="14.5" x2="9.5" y2="17" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
        </Svg>
      );
    case 'roofAux':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M4 16L6 10H18L20 16H4Z" stroke={color} strokeWidth={s} strokeLinejoin="round" />
          <Circle cx="8" cy="7" r="1.6" stroke={color} strokeWidth={1.6} />
          <Circle cx="12" cy="7" r="1.6" stroke={color} strokeWidth={1.6} />
          <Circle cx="16" cy="7" r="1.6" stroke={color} strokeWidth={1.6} />
          <Line x1="12" y1="2.5" x2="12" y2="4.2" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
        </Svg>
      );
    case 'grillLight':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Rect x="4" y="6" width="16" height="12" rx="2.5" stroke={color} strokeWidth={s} />
          <Line x1="7" y1="10" x2="17" y2="10" stroke={color} strokeWidth={1.6} />
          <Line x1="7" y1="14" x2="17" y2="14" stroke={color} strokeWidth={1.6} />
          <Circle cx="6.5" cy="12" r="1.5" fill={color} />
          <Circle cx="17.5" cy="12" r="1.5" fill={color} />
        </Svg>
      );
    case 'beacon':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M8 18L9.2 10H14.8L16 18H8Z" stroke={color} strokeWidth={s} strokeLinejoin="round" />
          <Line x1="6" y1="19" x2="18" y2="19" stroke={color} strokeWidth={2.2} strokeLinecap="round" />
          <Line x1="12" y1="4" x2="12" y2="7" stroke={color} strokeWidth={s} strokeLinecap="round" />
          <Line x1="5" y1="7" x2="7.2" y2="9" stroke={color} strokeWidth={s} strokeLinecap="round" />
          <Line x1="19" y1="7" x2="16.8" y2="9" stroke={color} strokeWidth={s} strokeLinecap="round" />
        </Svg>
      );
    case 'hazard':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M12 3.5L21 19.5H3L12 3.5Z" stroke={color} strokeWidth={2} strokeLinejoin="round" />
          <Path d="M12 9.5L16.5 17.2H7.5L12 9.5Z" stroke={color} strokeWidth={1.6} strokeLinejoin="round" />
        </Svg>
      );
    case 'wiper':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M3 10C7.5 6 16.5 6 21 10L17.5 18C14 16 10 16 6.5 18L3 10Z" stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
          <Line x1="12" y1="18" x2="15.5" y2="8.5" stroke={color} strokeWidth={2} strokeLinecap="round" />
        </Svg>
      );
    case 'washer':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M4 12C8 8.5 16 8.5 20 12L17 19H7L4 12Z" stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
          <Path d="M12 18V6C12 4.2 9.5 3.5 8 5" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
          <Path d="M12 6C12 4.2 14.5 3.5 16 5" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
        </Svg>
      );
    case 'engine':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M7 9H16L18 11H20V16H18L16.5 18H8L6 16H4V11H6L7 9Z" stroke={color} strokeWidth={s} strokeLinejoin="round" />
          <Line x1="11.5" y1="6" x2="11.5" y2="9" stroke={color} strokeWidth={s} strokeLinecap="round" />
          <Line x1="9" y1="6" x2="14" y2="6" stroke={color} strokeWidth={s} strokeLinecap="round" />
        </Svg>
      );
    case 'ignition':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle cx="9" cy="12" r="4.5" stroke={color} strokeWidth={s} />
          <Path d="M13.5 12H21V15.5M17.5 12V15" stroke={color} strokeWidth={s} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'parkingBrake':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle cx="12" cy="12" r="6.5" stroke={color} strokeWidth={s} />
          <Path d="M4.5 6.5C2.3 9.5 2.3 14.5 4.5 17.5" stroke={color} strokeWidth={s} strokeLinecap="round" />
          <Path d="M19.5 6.5C21.7 9.5 21.7 14.5 19.5 17.5" stroke={color} strokeWidth={s} strokeLinecap="round" />
          <Path d="M10.2 15.2V8.8H12.8C14 8.8 14.8 9.5 14.8 10.6C14.8 11.7 14 12.4 12.8 12.4H10.2" stroke={color} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'diffLock':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Rect x="4" y="4" width="3.5" height="6" rx="1" stroke={color} strokeWidth={1.7} />
          <Rect x="16.5" y="4" width="3.5" height="6" rx="1" stroke={color} strokeWidth={1.7} />
          <Rect x="4" y="14" width="3.5" height="6" rx="1" stroke={color} strokeWidth={1.7} />
          <Rect x="16.5" y="14" width="3.5" height="6" rx="1" stroke={color} strokeWidth={1.7} />
          <Line x1="7.5" y1="7" x2="16.5" y2="7" stroke={color} strokeWidth={1.7} />
          <Line x1="7.5" y1="17" x2="16.5" y2="17" stroke={color} strokeWidth={1.7} />
          <Line x1="12" y1="5" x2="12" y2="19" stroke={color} strokeWidth={1.7} />
          <Path d="M9.8 14.8L14.2 19.2M14.2 14.8L9.8 19.2" stroke={color} strokeWidth={2} strokeLinecap="round" />
        </Svg>
      );
    case 'truckLiftAxle':
    case 'trailerLiftAxle':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Line x1="3" y1="11" x2="21" y2="11" stroke={color} strokeWidth={2} strokeLinecap="round" />
          <Circle cx="7.5" cy="16" r="3" stroke={color} strokeWidth={1.8} />
          <Circle cx="16.5" cy="14" r="3" stroke={color} strokeWidth={1.8} />
          <Path d="M16.5 8.5V4M14.5 6L16.5 4L18.5 6" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'trailerCouple':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Rect x="3" y="6" width="13" height="7" rx="1" stroke={color} strokeWidth={s} />
          <Line x1="10" y1="13" x2="10" y2="17" stroke={color} strokeWidth={2.2} />
          <Path d="M6 17H19L21 19H5L6 17Z" stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
        </Svg>
      );
    case 'suspUp':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle cx="12" cy="16.5" r="3.5" stroke={color} strokeWidth={s} />
          <Line x1="4" y1="11" x2="20" y2="11" stroke={color} strokeWidth={s} strokeLinecap="round" />
          <Path d="M12 8.5V3.5M9.5 6L12 3.5L14.5 6" stroke={color} strokeWidth={s} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'suspDown':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle cx="12" cy="17" r="3.5" stroke={color} strokeWidth={s} />
          <Line x1="4" y1="11.5" x2="20" y2="11.5" stroke={color} strokeWidth={s} strokeLinecap="round" />
          <Path d="M12 3.5V8.5M9.5 6L12 8.5L14.5 6" stroke={color} strokeWidth={s} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'suspReset':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Line x1="3" y1="12" x2="21" y2="12" stroke={color} strokeWidth={2} strokeDasharray="3 2" />
          <Path d="M12 4L14.5 7H9.5L12 4Z" fill={color} />
          <Path d="M12 20L14.5 17H9.5L12 20Z" fill={color} />
        </Svg>
      );
    case 'exhaustBrake':
    case 'retarder':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle cx="12" cy="12" r="6" stroke={color} strokeWidth={s} strokeDasharray={name === 'retarder' ? '3 2' : undefined} />
          <Path d="M5 7C3 10 3 14 5 17" stroke={color} strokeWidth={s} strokeLinecap="round" />
          <Path d="M19 7C21 10 21 14 19 17" stroke={color} strokeWidth={s} strokeLinecap="round" />
          <Line x1="9" y1="15" x2="15" y2="9" stroke={color} strokeWidth={s} strokeLinecap="round" />
        </Svg>
      );
    case 'cruise':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M5.5 17.5C3.9 15.9 3 13.7 3 11.2C3 6.5 6.8 2.8 11.5 2.8C16.2 2.8 20 6.5 20 11.2C20 13.7 19.1 15.9 17.5 17.5" stroke={color} strokeWidth={s} strokeLinecap="round" />
          <Line x1="11.5" y1="11.5" x2="16" y2="7" stroke={color} strokeWidth={2} strokeLinecap="round" />
          <Path d="M18 4L16.5 6.8L19.5 6.8" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'laneKeep':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Line x1="8" y1="4" x2="4" y2="20" stroke={color} strokeWidth={2} strokeDasharray="3 2.5" strokeLinecap="round" />
          <Line x1="16" y1="4" x2="20" y2="20" stroke={color} strokeWidth={2} strokeDasharray="3 2.5" strokeLinecap="round" />
          <Rect x="9.5" y="9" width="5" height="8" rx="1.5" stroke={color} strokeWidth={1.8} />
        </Svg>
      );
    case 'hillHold':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M3 19L21 11V19H3Z" stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
          <Rect x="8" y="9.5" width="7" height="4" rx="1" transform="rotate(-22 8 9.5)" stroke={color} strokeWidth={1.8} />
        </Svg>
      );
    case 'speedLimit':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle cx="12" cy="12" r="8.5" stroke={color} strokeWidth={2.2} />
          <Path d="M8.5 10.5C8.5 9.2 9.5 8.5 10.5 8.5C11.5 8.5 12.2 9.2 12.2 10.2C12.2 11.2 11.2 11.8 10 11.8C11.4 11.8 12.4 12.6 12.4 13.8C12.4 15 11.4 15.8 10.3 15.8C9.2 15.8 8.4 15 8.4 14" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
          <Rect x="14" y="8.8" width="2.8" height="6.8" rx="1.4" stroke={color} strokeWidth={1.6} />
        </Svg>
      );
    case 'rangeGear':
    case 'splitGear':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Line x1="6" y1="5" x2="6" y2="19" stroke={color} strokeWidth={2} strokeLinecap="round" />
          <Line x1="12" y1="5" x2="12" y2="19" stroke={color} strokeWidth={2} strokeLinecap="round" />
          <Line x1="18" y1="5" x2="18" y2="19" stroke={color} strokeWidth={2} strokeLinecap="round" />
          <Line x1="6" y1="12" x2="18" y2="12" stroke={color} strokeWidth={2} />
        </Svg>
      );
    case 'windowL':
    case 'windowR':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <G transform={name === 'windowR' ? 'scale(-1, 1) translate(-24, 0)' : undefined}>
            <Path d="M5 18V10L10 5H19V18H5Z" stroke={color} strokeWidth={s} strokeLinejoin="round" />
            <Line x1="5" y1="12" x2="19" y2="12" stroke={color} strokeWidth={1.5} strokeDasharray="2.5 2" />
          </G>
        </Svg>
      );
    case 'camInterior':
    case 'camChase':
    case 'camMirror':
    case 'camLean':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Rect x="3" y="7" width="13" height="10" rx="2" stroke={color} strokeWidth={s} />
          <Path d="M16 10.5L21 7.5V16.5L16 13.5" stroke={color} strokeWidth={s} strokeLinejoin="round" />
        </Svg>
      );
    case 'horn':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M4 10H8L16 5V19L8 14H4V10Z" stroke={color} strokeWidth={s} strokeLinejoin="round" />
          <Path d="M19 9C20.5 10.5 20.5 13.5 19 15" stroke={color} strokeWidth={s} strokeLinecap="round" />
        </Svg>
      );
    case 'tractor':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle cx="7.5" cy="16.5" r="4" stroke={color} strokeWidth={s} />
          <Circle cx="18" cy="17.5" r="2.8" stroke={color} strokeWidth={s} />
          <Path d="M6 12.5V6H12.5L14.5 11H19.5V14.8" stroke={color} strokeWidth={s} strokeLinecap="round" strokeLinejoin="round" />
          <Line x1="17" y1="7" x2="17" y2="11" stroke={color} strokeWidth={s} strokeLinecap="round" />
        </Svg>
      );
    case 'pto':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle cx="12" cy="12" r="4.2" stroke={color} strokeWidth={s} />
          <Line x1="12" y1="3" x2="12" y2="6" stroke={color} strokeWidth={2} strokeLinecap="round" />
          <Line x1="12" y1="18" x2="12" y2="21" stroke={color} strokeWidth={2} strokeLinecap="round" />
          <Line x1="3" y1="12" x2="6" y2="12" stroke={color} strokeWidth={2} strokeLinecap="round" />
          <Line x1="18" y1="12" x2="21" y2="12" stroke={color} strokeWidth={2} strokeLinecap="round" />
          <Path d="M16.8 5.2C19.2 6.8 20.5 9.2 20.5 12" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
          <Path d="M7.2 18.8C4.8 17.2 3.5 14.8 3.5 12" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
        </Svg>
      );
    case 'hitch':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M4 8H9L12 12L9 16H4" stroke={color} strokeWidth={s} strokeLinecap="round" strokeLinejoin="round" />
          <Circle cx="15.5" cy="12" r="2.6" stroke={color} strokeWidth={s} />
          <Line x1="18.2" y1="12" x2="21" y2="12" stroke={color} strokeWidth={s} strokeLinecap="round" />
        </Svg>
      );
    case 'implementLift':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M4 15L10 11H16V17H10L4 15Z" stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
          <Path d="M19 5V19M16.5 7.5L19 5L21.5 7.5M16.5 16.5L19 19L21.5 16.5" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'implementAll':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Rect x="3" y="10" width="5" height="5" rx="1" stroke={color} strokeWidth={1.8} />
          <Rect x="16" y="10" width="5" height="5" rx="1" stroke={color} strokeWidth={1.8} />
          <Line x1="8" y1="12.5" x2="16" y2="12.5" stroke={color} strokeWidth={2} />
          <Path d="M12 4V9M9.8 6.2L12 4L14.2 6.2M12 20V15M9.8 17.8L12 20L14.2 17.8" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'unfold':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Rect x="9.5" y="11" width="5" height="7" rx="1" stroke={color} strokeWidth={1.8} />
          <Path d="M9.5 13L3.5 9M14.5 13L20.5 9" stroke={color} strokeWidth={2} strokeLinecap="round" />
          <Path d="M4 6.5L7.5 6.5M16.5 6.5L20 6.5" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
        </Svg>
      );
    case 'grainUnload':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M4 9L15 5L17 11L6 15L4 9Z" stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
          <Circle cx="8" cy="18" r="2.2" stroke={color} strokeWidth={1.8} />
          <Path d="M18.5 12.5L21 18.5M16.5 14.5L18.5 19" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeDasharray="2 2" />
        </Svg>
      );
    case 'pipeOut':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Rect x="4" y="11" width="9" height="7" rx="1.5" stroke={color} strokeWidth={1.8} />
          <Path d="M11 11L18 5.5H21V8" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          <Line x1="19.5" y1="10.5" x2="19.5" y2="15.5" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeDasharray="2 2" />
        </Svg>
      );
    case 'tarpCover':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Rect x="4" y="11" width="16" height="7" rx="1.5" stroke={color} strokeWidth={1.8} />
          <Path d="M4 11C7.5 6.5 16.5 6.5 20 11" stroke={color} strokeWidth={2} strokeLinecap="round" />
        </Svg>
      );
    case 'gpsTrack':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Line x1="6" y1="19" x2="9" y2="6" stroke={color} strokeWidth={1.8} strokeDasharray="2.5 2" strokeLinecap="round" />
          <Line x1="18" y1="19" x2="15" y2="6" stroke={color} strokeWidth={1.8} strokeDasharray="2.5 2" strokeLinecap="round" />
          <Line x1="12" y1="19" x2="12" y2="5" stroke={color} strokeWidth={2} strokeLinecap="round" />
          <Path d="M9.5 3.5C11 2.3 13 2.3 14.5 3.5" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
        </Svg>
      );
    case 'aiWorker':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle cx="12" cy="12" r="8" stroke={color} strokeWidth={1.9} />
          <Path d="M9 16L12 8L15 16M10 13.8H14" stroke={color} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'headlandIn':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Line x1="4" y1="19" x2="20" y2="19" stroke={color} strokeWidth={2} strokeLinecap="round" />
          <Path d="M12 4V15M8.5 11.5L12 15L15.5 11.5" stroke={color} strokeWidth={2.1} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'headlandOut':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M7 19V10C7 6.7 9.7 4 13 4C16.3 4 19 6.7 19 10V14" stroke={color} strokeWidth={2} strokeLinecap="round" />
          <Path d="M16 11.5L19 14.5L22 11.5" stroke={color} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'loaderArm':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M4 17L10 8L17 10" stroke={color} strokeWidth={2.1} strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M17 8L21 12L17 15V8Z" stroke={color} strokeWidth={1.9} strokeLinejoin="round" />
          <Circle cx="5" cy="17.5" r="2" stroke={color} strokeWidth={1.8} />
        </Svg>
      );
    case 'shuttleFnr':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M8 19V5M5 8L8 5L11 8" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M16 5V19M13 16L16 19L19 16" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'tensionBelt':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Rect x="4" y="10" width="16" height="8" rx="1.5" stroke={color} strokeWidth={1.8} />
          <Line x1="9" y1="6" x2="9" y2="18" stroke={color} strokeWidth={2} strokeLinecap="round" />
          <Line x1="15" y1="6" x2="15" y2="18" stroke={color} strokeWidth={2} strokeLinecap="round" />
        </Svg>
      );
    case 'seedRefill':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M12 4C12 4 7 9.5 7 13.5C7 16.5 9.2 19 12 19C14.8 19 17 16.5 17 13.5C17 9.5 12 4 12 4Z" stroke={color} strokeWidth={1.9} strokeLinejoin="round" />
          <Line x1="12" y1="11" x2="12" y2="16" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
          <Line x1="9.5" y1="13.5" x2="14.5" y2="13.5" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
        </Svg>
      );
    case 'shopBag':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Rect x="5" y="8" width="14" height="12" rx="2" stroke={color} strokeWidth={1.9} />
          <Path d="M9 8V6C9 4.3 10.3 3 12 3C13.7 3 15 4.3 15 6V8" stroke={color} strokeWidth={1.9} strokeLinecap="round" />
        </Svg>
      );
    case 'workLight':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Rect x="9" y="6" width="8" height="10" rx="2" stroke={color} strokeWidth={1.9} />
          <Line x1="13" y1="16" x2="13" y2="20" stroke={color} strokeWidth={2} strokeLinecap="round" />
          <Line x1="3" y1="8" x2="7" y2="9.5" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
          <Line x1="3" y1="12" x2="7" y2="12" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
          <Line x1="3" y1="16" x2="7" y2="14.5" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
        </Svg>
      );
    case 'vehicleSwitch':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M4 9H18L14.5 5.5" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M20 15H6L9.5 18.5" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    default:
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Rect x="4" y="5" width="16" height="14" rx="2.5" stroke={color} strokeWidth={s} />
          <Line x1="8" y1="10" x2="16" y2="10" stroke={color} strokeWidth={s} strokeLinecap="round" />
          <Line x1="8" y1="14" x2="13" y2="14" stroke={color} strokeWidth={s} strokeLinecap="round" />
        </Svg>
      );
  }
};
