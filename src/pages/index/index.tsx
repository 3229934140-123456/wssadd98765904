import React, { useState } from 'react';
import { View, Text, ScrollView, Image } from '@tarojs/components';
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro';
import dayjs from 'dayjs';
import { useDoor } from '@/store/DoorContext';
import DoorStatusCard from '@/components/DoorStatusCard';
import TempChart from '@/components/TempChart';
import AlarmPopup from '@/components/AlarmPopup';
import StatusBadge from '@/components/StatusBadge';
import type { AlarmRecord, AlarmReason } from '@/types';
import {
  getAlarmLevelText,
  getAlarmLevelColor,
  getAlarmStatusText,
  getAlarmStatusColor,
  formatTimeRelative,
  getReasonText
} from '@/utils';
import styles from './index.module.scss';

const IndexPage: React.FC = () => {
  const {
    doorInfo,
    tempRecords,
    alarms,
    currentAlarm,
    showAlarmPopup,
    handleAlarmReason,
    triggerAlarm,
    updateDoorStatus,
    getPendingAlarms
  } = useDoor();

  const [refreshing, setRefreshing] = useState(false);

  useDidShow(() => {
    console.log('[IndexPage] Page showed');
  });

  usePullDownRefresh(() => {
    handleRefresh();
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    console.log('[IndexPage] Refreshing data...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
    Taro.stopPullDownRefresh();
    Taro.showToast({ title: '刷新成功', icon: 'success' });
  };

  const handleAlarmReasonSelect = (reason: AlarmReason) => {
    const alarmId = currentAlarm?.id;
    handleAlarmReason(reason);
    if (alarmId) {
      setTimeout(() => {
        Taro.navigateTo({
          url: `/pages/alarmDetail/index?id=${alarmId}`
        });
      }, 100);
    }
  };

  const goToAlarmDetail = (alarm: AlarmRecord) => {
    console.log('[IndexPage] Navigate to alarm:', alarm.id);
    Taro.navigateTo({
      url: `/pages/alarmDetail/index?id=${alarm.id}`
    });
  };

  const handleSimulateAlarm = () => {
    Taro.showActionSheet({
      itemList: ['模拟车门开启', '模拟车门虚掩'],
      success: (res) => {
        if (res.tapIndex === 0) {
          triggerAlarm('open');
        } else {
          triggerAlarm('ajar');
        }
      }
    });
  };

  const handleToggleDoorStatus = () => {
    Taro.showActionSheet({
      itemList: ['设置为关闭', '设置为开启', '设置为虚掩'],
      success: (res) => {
        if (res.tapIndex === 0) {
          updateDoorStatus('closed');
        } else if (res.tapIndex === 1) {
          updateDoorStatus('open');
        } else {
          updateDoorStatus('ajar');
        }
      }
    });
  };

  const goToReview = () => {
    Taro.switchTab({
      url: '/pages/review/index'
    });
  };

  const currentTemp = tempRecords.length > 0 ? tempRecords[tempRecords.length - 1].temperature : 0;
  const pendingAlarms = getPendingAlarms();
  const recentAlarms = alarms.slice(0, 3);
  const greeting = dayjs().hour() < 6 ? '夜间行车注意安全' :
                   dayjs().hour() < 12 ? '上午好' :
                   dayjs().hour() < 18 ? '下午好' : '晚上好';

  const getAlarmTitle = (alarm: AlarmRecord) => {
    if (alarm.type === 'open') return '车门异常开启';
    if (alarm.type === 'ajar') return '车门疑似虚掩';
    return '温度异常';
  };

  return (
    <ScrollView
      scrollY
      className={styles.container}
      refresherEnabled
      refresherTriggered={refreshing}
      onRefresherRefresh={handleRefresh}
    >
      <View className={styles.greeting}>
        <Text className={styles.greetingTitle}>{greeting}，张师傅</Text>
        <Text className={styles.greetingSubtitle}>
          {dayjs().format('YYYY年MM月DD日 dddd')}
        </Text>
      </View>

      <View className={styles.section}>
        <DoorStatusCard doorInfo={doorInfo} currentTemp={currentTemp} onClick={handleToggleDoorStatus} />
      </View>

      <View className={styles.quickActions}>
        <View className={styles.quickActionCard} onClick={goToReview}>
          <View className={styles.quickActionIcon} style={{ background: 'rgba(22, 93, 255, 0.1)' }}>
            <Text>📋</Text>
          </View>
          <View className={styles.quickActionText}>
            <Text className={styles.quickActionTitle}>到站复核</Text>
            <Text className={styles.quickActionDesc}>扫码确认门磁</Text>
          </View>
        </View>
        <View className={styles.quickActionCard} onClick={handleSimulateAlarm}>
          <View className={styles.quickActionIcon} style={{ background: 'rgba(255, 125, 0, 0.1)' }}>
            <Text>🔔</Text>
          </View>
          <View className={styles.quickActionText}>
            <Text className={styles.quickActionTitle}>模拟告警</Text>
            <Text className={styles.quickActionDesc}>测试告警流程</Text>
          </View>
        </View>
      </View>

      <View className={styles.section}>
        <TempChart records={tempRecords} />
      </View>

      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>最近告警</Text>
          <Text className={styles.actionBtn}>查看全部</Text>
        </View>

        {recentAlarms.length > 0 ? (
          <View className={styles.alarmList}>
            {recentAlarms.map((alarm) => (
              <View
                key={alarm.id}
                className={styles.alarmItem}
                onClick={() => goToAlarmDetail(alarm)}
              >
                <View
                  className={styles.alarmLevel}
                  style={{ backgroundColor: getAlarmLevelColor(alarm.level) }}
                />
                {alarm.photos && alarm.status === 'resolved' && (
                  <View className={styles.alarmThumbnail} onClick={(e) => e.stopPropagation()}>
                    <Image
                      className={styles.thumbnailImg}
                      src={alarm.photos.seal}
                      mode='aspectFill'
                    />
                  </View>
                )}
                <View className={styles.alarmContent}>
                  <Text className={styles.alarmTitle}>{getAlarmTitle(alarm)}</Text>
                  <View className={styles.alarmMeta}>
                    <StatusBadge
                      text={getAlarmLevelText(alarm.level)}
                      color={getAlarmLevelColor(alarm.level)}
                    />
                    <StatusBadge
                      text={getAlarmStatusText(alarm.status)}
                      color={getAlarmStatusColor(alarm.status)}
                    />
                    {alarm.reason && (
                      <Text style={{ color: '#86909c' }}>{getReasonText(alarm.reason)}</Text>
                    )}
                  </View>
                  {alarm.status === 'resolved' && alarm.isRelocked !== undefined && (
                    <View className={styles.alarmMeta}>
                      <StatusBadge
                        text={alarm.isRelocked ? '已重新锁闭' : '未锁闭'}
                        color={alarm.isRelocked ? '#00b42a' : '#f53f3f'}
                      />
                    </View>
                  )}
                  <Text className={styles.alarmMeta} style={{ marginTop: 8 }}>
                    {formatTimeRelative(alarm.occurTime)} · {alarm.location}
                  </Text>
                </View>
                <Text className={styles.alarmArrow}>›</Text>
              </View>
            ))}
          </View>
        ) : (
          <View className={styles.emptyState}>
            <Text className={styles.emptyIcon}>✅</Text>
            <Text className={styles.emptyText}>暂无告警记录</Text>
          </View>
        )}
      </View>

      <View className={styles.fab} onClick={handleSimulateAlarm}>
        <Text className={styles.fabIcon}>🔔</Text>
        {pendingAlarms.length > 0 && (
          <View className={styles.fabBadge}>
            <Text>{pendingAlarms.length}</Text>
          </View>
        )}
      </View>

      <AlarmPopup
        visible={showAlarmPopup}
        doorInfo={doorInfo}
        alarmType={doorInfo.status === 'open' ? 'open' : doorInfo.status === 'ajar' ? 'ajar' : 'open'}
        onSelectReason={handleAlarmReasonSelect}
      />
    </ScrollView>
  );
};

export default IndexPage;
