import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CockpitTheme } from '../theme/cockpitTheme';
import { Fs25ShuttleDir } from '../types/fs25State';
import { CockpitHaptics } from '../utils/haptics';
import { TruckIcon } from './Icons';

interface Fs25RightCommandPodProps {
  cruiseEnabled: boolean;
  cruiseTargetKmh: number;
  toolLowered: boolean;
  ptoActive: boolean;
  shuttleDir: Fs25ShuttleDir;
  onHeadlandEnter: () => void;
  onHeadlandExit: () => void;
  onCruiseToggle: () => void;
  onCruiseStep: (delta: number) => void;
  onLowerTool: () => void;
  onTogglePto: () => void;
  onShuttleReverse: () => void;
}

const AGRI_GREEN = '#15803d';
const AGRI_AMBER = '#d97706';

export const Fs25RightCommandPod: React.FC<Fs25RightCommandPodProps> = React.memo(
  ({
    cruiseEnabled,
    cruiseTargetKmh,
    toolLowered,
    ptoActive,
    shuttleDir,
    onHeadlandEnter,
    onHeadlandExit,
    onCruiseToggle,
    onCruiseStep,
    onLowerTool,
    onTogglePto,
    onShuttleReverse,
  }) => {
    return (
      <View style={styles.container}>
        {/* Top: iTEC Headland Management One-Tap Dual Macro Triggers */}
        <View style={styles.itecCard}>
          <View style={styles.itecHeader}>
            <Text style={styles.itecBadge}>iTEC 地头联动</Text>
            <Text style={styles.itecHint}>一键宏</Text>
          </View>
          <View style={styles.itecBtnRow}>
            <Pressable
              onPress={() => {
                CockpitHaptics.heavyClunk();
                onHeadlandEnter();
              }}
              style={({ pressed }) => [
                styles.itecBtn,
                styles.itecEnterBtn,
                pressed && { transform: [{ scale: 0.95 }] },
              ]}
            >
              <TruckIcon name="headlandIn" size={18} color="#ffffff" />
              <Text style={styles.itecBtnTxt}>入垄下地</Text>
              <Text style={styles.itecSubTxt}>降具+巡航</Text>
            </Pressable>

            <Pressable
              onPress={() => {
                CockpitHaptics.heavyClunk();
                onHeadlandExit();
              }}
              style={({ pressed }) => [
                styles.itecBtn,
                styles.itecExitBtn,
                pressed && { transform: [{ scale: 0.95 }] },
              ]}
            >
              <TruckIcon name="headlandOut" size={18} color="#ffffff" />
              <Text style={styles.itecBtnTxt}>地头抬起</Text>
              <Text style={styles.itecSubTxt}>停航+全抬</Text>
            </Pressable>
          </View>
        </View>

        {/* Middle: Vario Tractor Cruise Control Dial & Thumb Wheel */}
        <View style={styles.cruisePod}>
          <Pressable
            onPress={() => {
              CockpitHaptics.switchClick();
              onCruiseToggle();
            }}
            style={({ pressed }) => [
              styles.cruiseMainBtn,
              cruiseEnabled && styles.cruiseMainBtnOn,
              pressed && { transform: [{ scale: 0.96 }] },
            ]}
          >
            <View style={styles.cruiseTopLine}>
              <Text style={[styles.cruiseTag, cruiseEnabled && { color: '#dcfce7' }]}>
                定速巡航 [3]
              </Text>
              <View
                style={[
                  styles.cruiseLed,
                  { backgroundColor: cruiseEnabled ? '#ffffff' : '#cbd5e1' },
                ]}
              />
            </View>
            <Text style={[styles.cruiseSpdNum, cruiseEnabled && { color: '#ffffff' }]}>
              {cruiseTargetKmh}
              <Text style={[styles.cruiseSpdUnit, cruiseEnabled && { color: '#dcfce7' }]}>
                {' '}KM/H
              </Text>
            </Text>
          </Pressable>

          <View style={styles.wheelStepRow}>
            <Pressable
              onPress={() => {
                CockpitHaptics.tick();
                onCruiseStep(-1);
              }}
              style={({ pressed }) => [styles.stepBtn, pressed && { opacity: 0.7 }]}
            >
              <Text style={styles.stepSym}>−</Text>
              <Text style={styles.stepKey}>[1]</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                CockpitHaptics.tick();
                onCruiseStep(1);
              }}
              style={({ pressed }) => [styles.stepBtn, pressed && { opacity: 0.7 }]}
            >
              <Text style={styles.stepSym}>+</Text>
              <Text style={styles.stepKey}>[2]</Text>
            </Pressable>
          </View>
        </View>

        {/* Bottom: Primary Right-Hand Thumb Trio (Lift [V], PTO [B], Shuttle [Space]) */}
        <View style={styles.quickTrioCol}>
          <View style={styles.quickPairRow}>
            <Pressable
              onPress={() => {
                CockpitHaptics.switchClick();
                onLowerTool();
              }}
              style={({ pressed }) => [
                styles.quickTile,
                toolLowered && { backgroundColor: AGRI_GREEN },
                pressed && { transform: [{ scale: 0.95 }] },
              ]}
            >
              <Text style={[styles.quickKey, toolLowered && { color: '#dcfce7' }]}>[V]</Text>
              <Text style={[styles.quickLbl, toolLowered && { color: '#ffffff' }]}>
                {toolLowered ? '已降下' : '升降具'}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => {
                CockpitHaptics.switchClick();
                onTogglePto();
              }}
              style={({ pressed }) => [
                styles.quickTile,
                ptoActive && { backgroundColor: AGRI_AMBER },
                pressed && { transform: [{ scale: 0.95 }] },
              ]}
            >
              <Text style={[styles.quickKey, ptoActive && { color: '#fef3c7' }]}>[B]</Text>
              <Text style={[styles.quickLbl, ptoActive && { color: '#ffffff' }]}>
                {ptoActive ? 'PTO转' : '开农具'}
              </Text>
            </Pressable>
          </View>

          <Pressable
            onPress={() => {
              CockpitHaptics.warningPulse();
              onShuttleReverse();
            }}
            style={({ pressed }) => [
              styles.shuttleBar,
              shuttleDir === 'R' && styles.shuttleBarRev,
              pressed && { transform: [{ scale: 0.96 }] },
            ]}
          >
            <TruckIcon
              name="shuttleFnr"
              size={16}
              color={shuttleDir === 'R' ? '#ffffff' : CockpitTheme.ink}
            />
            <Text style={[styles.shuttleTxt, shuttleDir === 'R' && { color: '#ffffff' }]}>
              换向梭挡 · {shuttleDir === 'R' ? 'R 倒退' : 'F 前进'}
            </Text>
            <Text style={[styles.shuttleKey, shuttleDir === 'R' && { color: '#fee2e2' }]}>
              [Space]
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    width: 150,
    paddingHorizontal: 7,
    paddingVertical: 8,
    justifyContent: 'space-between',
    gap: 7,
    backgroundColor: CockpitTheme.dashSurface,
  },
  itecCard: {
    backgroundColor: '#ffffff',
    borderRadius: 15,
    padding: 7,
    gap: 6,
    boxShadow: CockpitTheme.shadowSoft,
  },
  itecHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  itecBadge: {
    fontSize: 9.5,
    fontWeight: '800',
    color: AGRI_GREEN,
  },
  itecHint: {
    fontSize: 8.5,
    fontWeight: '700',
    color: CockpitTheme.muted,
  },
  itecBtnRow: {
    flexDirection: 'row',
    gap: 6,
  },
  itecBtn: {
    flex: 1,
    borderRadius: 11,
    paddingVertical: 7,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  itecEnterBtn: {
    backgroundColor: AGRI_GREEN,
  },
  itecExitBtn: {
    backgroundColor: AGRI_AMBER,
  },
  itecBtnTxt: {
    fontSize: 10,
    fontWeight: '800',
    color: '#ffffff',
  },
  itecSubTxt: {
    fontSize: 8,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.85)',
  },
  cruisePod: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 15,
    padding: 7,
    justifyContent: 'space-between',
    gap: 6,
    boxShadow: CockpitTheme.shadowSoft,
  },
  cruiseMainBtn: {
    flex: 1,
    borderRadius: 11,
    backgroundColor: '#f3f1ec',
    paddingHorizontal: 9,
    paddingVertical: 6,
    justifyContent: 'space-between',
  },
  cruiseMainBtnOn: {
    backgroundColor: AGRI_GREEN,
  },
  cruiseTopLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cruiseTag: {
    fontSize: 9,
    fontWeight: '800',
    color: CockpitTheme.muted,
  },
  cruiseLed: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  cruiseSpdNum: {
    fontSize: 23,
    fontWeight: '800',
    color: CockpitTheme.ink,
    fontVariant: ['tabular-nums'],
  },
  cruiseSpdUnit: {
    fontSize: 9.5,
    fontWeight: '800',
    color: CockpitTheme.muted,
  },
  wheelStepRow: {
    flexDirection: 'row',
    gap: 6,
    height: 34,
  },
  stepBtn: {
    flex: 1,
    borderRadius: 10,
    backgroundColor: '#f3f1ec',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  stepSym: {
    fontSize: 17,
    fontWeight: '800',
    color: CockpitTheme.ink,
  },
  stepKey: {
    fontSize: 8.5,
    fontWeight: '700',
    color: CockpitTheme.muted,
  },
  quickTrioCol: {
    gap: 6,
  },
  quickPairRow: {
    flexDirection: 'row',
    gap: 6,
    height: 46,
  },
  quickTile: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    paddingVertical: 5,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'space-between',
    boxShadow: CockpitTheme.shadowSoft,
  },
  quickKey: {
    fontSize: 8.5,
    fontWeight: '800',
    color: CockpitTheme.muted,
  },
  quickLbl: {
    fontSize: 10.5,
    fontWeight: '800',
    color: CockpitTheme.ink,
  },
  shuttleBar: {
    height: 36,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 9,
    boxShadow: CockpitTheme.shadowSoft,
  },
  shuttleBarRev: {
    backgroundColor: '#f04438',
  },
  shuttleTxt: {
    fontSize: 9.5,
    fontWeight: '800',
    color: CockpitTheme.ink,
  },
  shuttleKey: {
    fontSize: 8,
    fontWeight: '700',
    color: CockpitTheme.muted,
  },
});
