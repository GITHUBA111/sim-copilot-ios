import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CockpitTheme } from '../theme/cockpitTheme';
import { Fs25LayoutMode, GameCockpitMode } from '../types/fs25State';
import { CockpitHaptics } from '../utils/haptics';
import { TruckIcon } from './Icons';

interface CockpitGarageModalProps {
  visible: boolean;
  currentGame: GameCockpitMode;
  currentFsLayout: Fs25LayoutMode;
  wsConnected: boolean;
  onSelectEts2: () => void;
  onSelectFs25: (layout: Fs25LayoutMode) => void;
  onClose: () => void;
}

export const CockpitGarageModal: React.FC<CockpitGarageModalProps> = ({
  visible,
  currentGame,
  currentFsLayout,
  wsConnected,
  onSelectEts2,
  onSelectFs25,
  onClose,
}) => {
  if (!visible) return null;

  return (
    <View style={styles.backdrop}>
      <View style={styles.sheet}>
        {/* Top Product Bar */}
        <View style={styles.headerRow}>
          <View style={styles.titleGroup}>
            <Text style={styles.productTitle}>模拟驾驶完美搭子 · 双栖座舱总控</Text>
            <View style={styles.statusPill}>
              <View
                style={[
                  styles.dot,
                  { backgroundColor: wsConnected ? '#12b76a' : '#ff8a00' },
                ]}
              />
              <Text style={styles.statusTxt}>
                {wsConnected ? '电脑伴侣已连接 · 自动同步键位' : '离线试驾就绪 · 连同一Wi-Fi即可控电脑'}
              </Text>
            </View>
          </View>
          <Pressable
            onPress={() => {
              CockpitHaptics.tick();
              onClose();
            }}
            style={styles.closeBtn}
          >
            <Text style={styles.closeTxt}>返回座舱 ✕</Text>
          </Pressable>
        </View>

        {/* Dual Flagship Product Cards */}
        <View style={styles.cardsRow}>
          {/* CARD 1: ETS2 / ATS */}
          <View
            style={[
              styles.card,
              currentGame === 'ets2' && styles.cardActiveEts,
            ]}
          >
            <View style={styles.cardTop}>
              <View style={[styles.iconBadge, { backgroundColor: '#fff0e6' }]}>
                <TruckIcon name="trailerCouple" size={22} color="#ea580c" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTagEts}>SCANIA OPTICRUISE · 公路重卡</Text>
                <Text style={styles.cardTitle}>欧洲卡车模拟 2 / 美卡</Text>
              </View>
            </View>

            <Text style={styles.cardDesc}>
              900°/1800° 拟真助力转向 · 12 速序列变速箱 · 5 段液力缓速器 · 气刹底盘升降 · 真车仪表数据实时回传
            </Text>

            <Pressable
              onPress={() => {
                CockpitHaptics.heavyClunk();
                onSelectEts2();
              }}
              style={({ pressed }) => [
                styles.primaryBtnEts,
                pressed && { transform: [{ scale: 0.97 }] },
              ]}
            >
              <Text style={styles.primaryBtnTxt}>进入欧卡重卡座舱 →</Text>
            </Pressable>
          </View>

          {/* CARD 2: FARMING SIMULATOR 2025 */}
          <View
            style={[
              styles.card,
              currentGame === 'fs25' && styles.cardActiveFs,
            ]}
          >
            <View style={styles.cardTop}>
              <View style={[styles.iconBadge, { backgroundColor: '#dcfce7' }]}>
                <TruckIcon name="tractor" size={22} color="#15803d" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTagFs}>AGRI COMMANDARM · 现代农机</Text>
                <Text style={styles.cardTitle}>农场模拟 2025 (FS25)</Text>
              </View>
            </View>

            <Text style={styles.cardDesc}>
              免插件直连 · 2D 双油路前铲/抓爪十字液压摇杆 · iTEC 地头一键全降巡航宏 · 原厂 GPS 辅助转向长按呼出
            </Text>

            <View style={styles.fsBtnRow}>
              <Pressable
                onPress={() => {
                  CockpitHaptics.heavyClunk();
                  onSelectFs25('sidepanel');
                }}
                style={({ pressed }) => [
                  styles.fsBtnMain,
                  currentGame === 'fs25' && currentFsLayout === 'sidepanel' && styles.fsBtnSelected,
                  pressed && { transform: [{ scale: 0.97 }] },
                ]}
              >
                <Text style={styles.primaryBtnTxt}>🕹️ 农机侧台</Text>
                <Text style={styles.btnSubHint}>配电脑键鼠/真盘</Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  CockpitHaptics.heavyClunk();
                  onSelectFs25('full');
                }}
                style={({ pressed }) => [
                  styles.fsBtnSecondary,
                  currentGame === 'fs25' && currentFsLayout === 'full' && styles.fsBtnSecSelected,
                  pressed && { transform: [{ scale: 0.97 }] },
                ]}
              >
                <Text
                  style={[
                    styles.secondaryBtnTxt,
                    currentGame === 'fs25' && currentFsLayout === 'full' && { color: '#ffffff' },
                  ]}
                >
                  🚜 全触屏驾驶
                </Text>
                <Text
                  style={[
                    styles.btnSubHintDark,
                    currentGame === 'fs25' &&
                      currentFsLayout === 'full' && { color: 'rgba(255,255,255,0.85)' },
                  ]}
                >
                  含方向盘与踏板
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.56)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    zIndex: 80,
  },
  sheet: {
    width: '100%',
    maxWidth: 740,
    backgroundColor: '#f3f1ec',
    borderRadius: 24,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: '#ffffff',
    boxShadow: '0 16px 40px rgba(15, 23, 42, 0.28)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    flex: 1,
  },
  productTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: CockpitTheme.ink,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#ffffff',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
  },
  dot: {
    width: 6.5,
    height: 6.5,
    borderRadius: 3.5,
  },
  statusTxt: {
    fontSize: 9.5,
    fontWeight: '700',
    color: CockpitTheme.inkSoft,
  },
  closeBtn: {
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: '#ffffff',
  },
  closeTxt: {
    fontSize: 10,
    fontWeight: '800',
    color: CockpitTheme.inkSoft,
  },
  cardsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  card: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 12,
    justifyContent: 'space-between',
    gap: 10,
    borderWidth: 2,
    borderColor: 'transparent',
    boxShadow: CockpitTheme.shadowSoft,
  },
  cardActiveEts: {
    borderColor: '#fb923c',
  },
  cardActiveFs: {
    borderColor: '#22c55e',
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTagEts: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#ea580c',
    letterSpacing: 0.4,
  },
  cardTagFs: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#15803d',
    letterSpacing: 0.4,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: CockpitTheme.ink,
    marginTop: 1,
  },
  cardDesc: {
    fontSize: 10,
    lineHeight: 15,
    fontWeight: '600',
    color: CockpitTheme.inkSoft,
  },
  primaryBtnEts: {
    height: 42,
    borderRadius: 12,
    backgroundColor: '#ea580c',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnTxt: {
    fontSize: 11.5,
    fontWeight: '900',
    color: '#ffffff',
  },
  fsBtnRow: {
    flexDirection: 'row',
    gap: 7,
  },
  fsBtnMain: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#15803d',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fsBtnSelected: {
    backgroundColor: '#166534',
  },
  fsBtnSecondary: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#f3f1ec',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fsBtnSecSelected: {
    backgroundColor: '#15803d',
  },
  secondaryBtnTxt: {
    fontSize: 11,
    fontWeight: '900',
    color: CockpitTheme.ink,
  },
  btnSubHint: {
    fontSize: 8,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.85)',
  },
  btnSubHintDark: {
    fontSize: 8,
    fontWeight: '700',
    color: CockpitTheme.muted,
  },
});
