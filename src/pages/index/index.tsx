import React, { useState, useMemo, useRef } from 'react';
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

type AlarmFilter = 'all' | 'pending' | 'processing' | 'resolved';

const filterTabs: { value: AlarmFilter; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'pending', label: '待处理' },
  { value: 'processing', label: '处理中' },
  { value: 'resolved', label: '已处理' }
];

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
  const [alarmFilter, setAlarmFilter] = useState<AlarmFilter>('all');
  const [scrollTop, setScrollTop] = useState(0);
  const alarmSectionRef = useRef<number>(0);

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
  const filteredAlarms = useMemo(() => {
    if (alarmFilter === 'all') return alarms.slice(0, 5);
    return alarms.filter(a => a.status === alarmFilter).slice(0, 5);
  }, [alarms, alarmFilter]);

  const handoverSummary = useMemo(() => {
    const vehicleMap = new Map<string, {
      pending: number
      processing: number
      resolved: number
      total: number
    }>()

    const addToMap = (vehicleNo: string, status: string) => {
      if (!vehicleMap.has(vehicleNo)) {
        vehicleMap.set(vehicleNo, { pending: 0, processing: 0, resolved: 0, total: 0 })
      }
      const stats = vehicleMap.get(vehicleNo)!
      stats.total++
      if (status === 'pending') stats.pending++
      else if (status === 'processing') stats.processing++
      else if (status === 'resolved') stats.resolved++
    }

    alarms.forEach(alarm => {
      addToMap(doorInfo.vehicleNo, alarm.status)
    })

    const result: {
      vehicleNo: string
      pending: number
      processing: number
      resolved: number
      total: number
    }[] = []

    vehicleMap.forEach((stats, vehicleNo) => {
      result.push({ vehicleNo, ...stats })
    })

    return result.sort((a, b) => b.total - a.total)
  }, [alarms, doorInfo.vehicleNo])

  const handleSummaryClick = (filter: AlarmFilter) => {
    setAlarmFilter(filter)
    setScrollTop(600)
    setTimeout(() => setScrollTop(-1), 100)
  }

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
      scrollTop={scrollTop > 0 ? scrollTop : undefined}
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
          <Text className={styles.sectionTitle}>交接概览</Text>
          <Text className={styles.sectionSubtitle}>今晚夜班进度</Text>
        </View>
        
        {handoverSummary.map((vehicle) => (
          <View key={vehicle.vehicleNo} className={styles.handoverCard}>
            <View className={styles.handoverHeader}>
              <Text className={styles.handoverVehicle}>{vehicle.vehicleNo}</Text>
              <Text className={styles.handoverTotal}>共 {vehicle.total} 条</Text>
            </View>
            <View className={styles.handoverStats}>
              <View
                className={classnames(styles.handoverStat, alarmFilter === 'pending' && styles.handoverStatActive)}
                onClick={() => handleSummaryClick('pending')}
              >
                <Text className={styles.handoverStatCount} style={{ color: '#f53f3f' }}>{vehicle.pending}</Text>
                <Text className={styles.handoverStatLabel}>待处理</Text>
              </View>
              <View
                className={classnames(styles.handoverStat, alarmFilter === 'processing' && styles.handoverStatActive)}
                onClick={() => handleSummaryClick('processing')}
              >
                <Text className={styles.handoverStatCount} style={{ color: '#ff7d00' }}>{vehicle.processing}</Text>
                <Text className={styles.handoverStatLabel}>处理中</Text>
              </View>
              <View
                className={classnames(styles.handoverStat, alarmFilter === 'resolved' && styles.handoverStatActive)}
                onClick={() => handleSummaryClick('resolved')}
              >
                <Text className={styles.handoverStatCount} style={{ color: '#00b42a' }}>{vehicle.resolved}</Text>
                <Text className={styles.handoverStatLabel}>已完成</Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>最近告警</Text>
          <Text className={styles.actionBtn}>查看全部</Text>
        </View>

        <View className={styles.filterTabs}>
          {filterTabs.map(tab => (
            <View
              key={tab.value}
              className={[
                styles.filterTab,
                alarmFilter === tab.value ? styles.filterTabActive : ''
              ].join(' ')}
              onClick={() => setAlarmFilter(tab.value)}
            >
              <Text
                className={[
                  styles.filterTabText,
                  alarmFilter === tab.value ? styles.filterTabTextActive : ''
                ].join(' ')}
              >
                {tab.label}
              </Text>
              {tab.value !== 'all' && (
                <View
                  className={[
                    styles.filterTabCount,
                    alarmFilter === tab.value ? styles.filterTabCountActive : ''
                  ].join(' ')}
                >
                  <Text>{alarms.filter(a => a.status === tab.value).length}</Text>
                </View>
              )}
            </View>
          ))}
        </View>

        {filteredAlarms.length > 0 ? (
          <View className={styles.alarmList}>
            {filteredAlarms.map((alarm) => (
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
