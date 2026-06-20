import React, { useState, useEffect } from 'react';
import { View, Text, Button, Textarea, Image, ScrollView } from '@tarojs/components';
import Taro, { useDidShow, useRouter } from '@tarojs/taro';
import classnames from 'classnames';
import { useDoor } from '@/store/DoorContext';
import PhotoStep from '@/components/PhotoStep';
import StatusBadge from '@/components/StatusBadge';
import {
  formatTime,
  getReasonText,
  getAlarmLevelColor,
  getAlarmLevelText,
  getAlarmStatusText,
  getAlarmStatusColor
} from '@/utils';
import type { AlarmReason } from '@/types';
import styles from './index.module.scss';

const AlarmDetailPage: React.FC = () => {
  const router = useRouter();
  const { alarms, submitAlarmHandle } = useDoor();
  
  const [alarm, setAlarm] = useState(alarms[0]);
  const [doorPhoto, setDoorPhoto] = useState('');
  const [sealPhoto, setSealPhoto] = useState('');
  const [envPhoto, setEnvPhoto] = useState('');
  const [isRelocked, setIsRelocked] = useState<boolean | null>(null);
  const [remark, setRemark] = useState('');
  const [loading, setLoading] = useState(false);

  useDidShow(() => {
    const alarmId = router.params.id;
    if (alarmId) {
      const found = alarms.find(a => a.id === alarmId);
      if (found) {
        setAlarm(found);
        console.log('[AlarmDetailPage] Loaded alarm:', found.id);
        
        if (found.photos) {
          setDoorPhoto(found.photos.door);
          setSealPhoto(found.photos.seal);
          setEnvPhoto(found.photos.environment);
        }
        if (found.isRelocked !== undefined) {
          setIsRelocked(found.isRelocked);
        }
        if (found.remark) {
          setRemark(found.remark);
        }
      }
    }
  });

  useEffect(() => {
    if (alarm?.status === 'resolved') {
      setIsRelocked(alarm.isRelocked ?? null);
      setRemark(alarm.remark ?? '');
      if (alarm.photos) {
        setDoorPhoto(alarm.photos.door);
        setSealPhoto(alarm.photos.seal);
        setEnvPhoto(alarm.photos.environment);
      }
    }
  }, [alarm]);

  const getAlarmTitle = () => {
    if (alarm?.type === 'open') return '车门异常开启';
    if (alarm?.type === 'ajar') return '车门疑似虚掩';
    return '温度异常';
  };

  const getReasonColor = (reason: AlarmReason) => {
    const map = {
      loading: '#165dff',
      misoperation: '#ff7d00',
      abnormal: '#f53f3f'
    };
    return map[reason] || '#86909c';
  };

  const canSubmit = () => {
    if (alarm?.status === 'resolved') return false;
    return doorPhoto && sealPhoto && envPhoto && isRelocked !== null;
  };

  const handleSubmit = async () => {
    if (!canSubmit() || !alarm) return;
    
    setLoading(true);
    console.log('[AlarmDetailPage] Submitting alarm handle:', alarm.id);
    
    try {
      const success = submitAlarmHandle(alarm.id, {
        photos: {
          door: doorPhoto,
          seal: sealPhoto,
          environment: envPhoto
        },
        isRelocked,
        handler: '张师傅',
        remark
      });
      
      if (success) {
        Taro.showToast({ title: '处置提交成功', icon: 'success' });
        setTimeout(() => {
          Taro.navigateBack();
        }, 1500);
      } else {
        Taro.showToast({ title: '提交失败，请重试', icon: 'none' });
      }
    } catch (err) {
      console.error('[AlarmDetailPage] Submit error:', err);
      Taro.showToast({ title: '提交失败', icon: 'none' });
    } finally {
      setLoading(false);
    }
  };

  const handlePreviewImage = (url: string) => {
    Taro.previewImage({
      urls: [url],
      current: url
    });
  };

  if (!alarm) {
    return (
      <View className={styles.container}>
        <View className={styles.alarmInfo}>
          <Text style={{ color: '#86909c' }}>加载中...</Text>
        </View>
      </View>
    );
  }

  const isResolved = alarm.status === 'resolved';

  return (
    <ScrollView scrollY className={styles.container}>
      <View className={styles.alarmHeader}>
        <Text className={styles.alarmType}>🚨 {getAlarmTitle()}</Text>
        <Text className={styles.alarmTime}>{formatTime(alarm.occurTime)}</Text>
      </View>

      <View className={styles.alarmInfo}>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>告警级别</Text>
          <View className={styles.infoValue}>
            <StatusBadge
              text={getAlarmLevelText(alarm.level)}
              color={getAlarmLevelColor(alarm.level)}
            />
          </View>
        </View>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>当前状态</Text>
          <View className={styles.infoValue}>
            <StatusBadge
              text={getAlarmStatusText(alarm.status)}
              color={getAlarmStatusColor(alarm.status)}
            />
          </View>
        </View>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>发生位置</Text>
          <Text className={styles.infoValue}>{alarm.location}</Text>
        </View>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>车辆编号</Text>
          <Text className={styles.infoValue}>{alarm.doorId}</Text>
        </View>
      </View>

      {alarm.reason && (
        <View className={styles.reasonSection}>
          <Text className={styles.sectionTitle}>开门原因</Text>
          <View
            className={styles.reasonBadge}
            style={{
              backgroundColor: `${getReasonColor(alarm.reason)}15`,
              color: getReasonColor(alarm.reason)
            }}
          >
            <Text>{getReasonText(alarm.reason)}</Text>
          </View>
        </View>
      )}

      {isResolved ? (
        <View className={styles.resolvedSection}>
          <Text className={styles.resolvedTitle}>
            ✅ 已处理完成
          </Text>
          <Text className={styles.resolvedInfo}>
            处理人：{alarm.handler} · {formatTime(alarm.handleTime!)}
          </Text>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>是否锁闭</Text>
            <Text className={styles.infoValue}>
              {alarm.isRelocked ? '已重新锁闭' : '未锁闭'}
            </Text>
          </View>
          {alarm.remark && (
            <View className={styles.infoRow}>
              <Text className={styles.infoLabel}>处理备注</Text>
              <Text className={styles.infoValue}>{alarm.remark}</Text>
            </View>
          )}
          {alarm.photos && (
            <View className={styles.photoPreview}>
              <View className={styles.photoWrapper}>
                <Image
                  className={styles.image}
                  src={alarm.photos.door}
                  mode='aspectFill'
                  onClick={() => handlePreviewImage(alarm.photos!.door)}
                />
                <Text className={styles.photoLabel}>车门照片</Text>
              </View>
              <View className={styles.photoWrapper}>
                <Image
                  className={styles.image}
                  src={alarm.photos.seal}
                  mode='aspectFill'
                  onClick={() => handlePreviewImage(alarm.photos!.seal)}
                />
                <Text className={styles.photoLabel}>封签照片</Text>
              </View>
              <View className={styles.photoWrapper}>
                <Image
                  className={styles.image}
                  src={alarm.photos.environment}
                  mode='aspectFill'
                  onClick={() => handlePreviewImage(alarm.photos!.environment)}
                />
                <Text className={styles.photoLabel}>环境照片</Text>
              </View>
            </View>
          )}
        </View>
      ) : (
        <>
          <View className={styles.photoSection}>
            <Text className={styles.sectionTitle}>拍照取证</Text>
            <PhotoStep
              step={1}
              title='拍摄车门状态'
              hint='请拍摄完整的车门照片，清晰显示门磁状态'
              photoUrl={doorPhoto}
              onPhotoChange={setDoorPhoto}
              completed={!!doorPhoto}
              tip='确保门磁设备清晰可见'
            />
            <PhotoStep
              step={2}
              title='拍摄封签状态'
              hint='请拍摄封签的特写照片，清晰显示封签编号'
              photoUrl={sealPhoto}
              onPhotoChange={setSealPhoto}
              completed={!!sealPhoto}
              tip='封签编号需要清晰可辨'
            />
            <PhotoStep
              step={3}
              title='拍摄周边环境'
              hint='请拍摄车辆周边环境照片，显示当前位置特征'
              photoUrl={envPhoto}
              onPhotoChange={setEnvPhoto}
              completed={!!envPhoto}
              tip='可拍摄路牌、地标等位置标识'
            />
          </View>

          <View className={styles.relockSection}>
            <Text className={styles.sectionTitle}>是否已重新锁闭？</Text>
            <View className={styles.radioGroup}>
              <View
                className={classnames(styles.radioItem, isRelocked === true && styles.active)}
                onClick={() => setIsRelocked(true)}
              >
                <Text className={styles.radioIcon}>🔒</Text>
                <Text className={styles.radioText}>已锁闭</Text>
              </View>
              <View
                className={classnames(styles.radioItem, isRelocked === false && styles.active)}
                onClick={() => setIsRelocked(false)}
              >
                <Text className={styles.radioIcon}>🔓</Text>
                <Text className={styles.radioText}>未锁闭</Text>
              </View>
            </View>
          </View>

          <View className={styles.remarkSection}>
            <Text className={styles.sectionTitle}>备注说明（选填）</Text>
            <Textarea
              className={styles.textarea}
              placeholder='请输入处理情况说明...'
              value={remark}
              onInput={(e) => setRemark(e.detail.value)}
              maxlength={200}
            />
          </View>
        </>
      )}

      {!isResolved && (
        <View className={styles.bottomBar}>
          <Button
            className={classnames(styles.submitBtn, !canSubmit() && styles.disabled)}
            onClick={handleSubmit}
            disabled={!canSubmit() || loading}
          >
            <Text>{loading ? '提交中...' : '提交处置记录'}</Text>
          </Button>
        </View>
      )}
    </ScrollView>
  );
};

export default AlarmDetailPage;
