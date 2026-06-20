import React, { useState } from 'react';
import { View, Text, Button, Image, Textarea, ScrollView } from '@tarojs/components';
import Taro, { usePullDownRefresh, useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import { useDoor } from '@/store/DoorContext';
import StatusBadge from '@/components/StatusBadge';
import type { DoorStatus } from '@/types';
import {
  getDoorStatusText,
  getDoorStatusColor,
  getSealStatusText,
  getSealStatusColor,
  formatTimeRelative
} from '@/utils';
import styles from './index.module.scss';

const ReviewPage: React.FC = () => {
  const { doorInfo, reviews, submitReview } = useDoor();
  
  const [scanned, setScanned] = useState(false);
  const [doorStatus, setDoorStatus] = useState<DoorStatus>('closed');
  const [sealStatus, setSealStatus] = useState<'intact' | 'broken'>('intact');
  const [remark, setRemark] = useState('');
  const [doorPhoto, setDoorPhoto] = useState('');
  const [sealPhoto, setSealPhoto] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useDidShow(() => {
    console.log('[ReviewPage] Page showed');
  });

  usePullDownRefresh(() => {
    handleRefresh();
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    console.log('[ReviewPage] Refreshing data...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
    Taro.stopPullDownRefresh();
  };

  const handleScan = async () => {
    try {
      const res = await Taro.scanCode({
        scanType: ['qrCode', 'barCode']
      });
      console.log('[ReviewPage] Scan result:', res.result);
      setScanned(true);
      setDoorStatus(doorInfo.status);
      Taro.showToast({ title: '扫码成功', icon: 'success' });
    } catch (err) {
      console.error('[ReviewPage] Scan error:', err);
      Taro.showToast({ title: '扫码失败，请重试', icon: 'none' });
    }
  };

  const handleChooseImage = async (type: 'door' | 'seal') => {
    try {
      const res = await Taro.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['camera', 'album']
      });
      
      if (res.tempFilePaths && res.tempFilePaths.length > 0) {
        if (type === 'door') {
          setDoorPhoto(res.tempFilePaths[0]);
        } else {
          setSealPhoto(res.tempFilePaths[0]);
        }
        console.log('[ReviewPage] Photo selected:', type, res.tempFilePaths[0]);
      }
    } catch (err) {
      console.error('[ReviewPage] Choose image error:', err);
      Taro.showToast({ title: '拍照失败', icon: 'none' });
    }
  };

  const handleRemovePhoto = (type: 'door' | 'seal', e: any) => {
    e.stopPropagation();
    if (type === 'door') {
      setDoorPhoto('');
    } else {
      setSealPhoto('');
    }
  };

  const handleSubmit = () => {
    if (!doorPhoto || !sealPhoto) {
      Taro.showToast({ title: '请拍摄完整照片', icon: 'none' });
      return;
    }

    const success = submitReview({
      doorId: doorInfo.id,
      reviewer: '李站长',
      doorStatus,
      sealStatus,
      photos: {
        door: doorPhoto,
        seal: sealPhoto
      },
      remark
    });

    if (success) {
      Taro.showToast({ title: '复核提交成功', icon: 'success' });
      setScanned(false);
      setDoorStatus('closed');
      setSealStatus('intact');
      setRemark('');
      setDoorPhoto('');
      setSealPhoto('');
    } else {
      Taro.showToast({ title: '提交失败，请重试', icon: 'none' });
    }
  };

  const canSubmit = scanned && doorPhoto && sealPhoto;

  return (
    <ScrollView
      scrollY
      className={styles.container}
      refresherEnabled
      refresherTriggered={refreshing}
      onRefresherRefresh={handleRefresh}
    >
      <View className={styles.scanSection}>
        <Text className={styles.scanTitle}>扫码复核门磁状态</Text>
        <Text className={styles.scanDesc}>
          扫描车辆二维码，确认门磁和封签状态，避免途中异常被口头带过
        </Text>
        <Button className={styles.scanBtn} onClick={handleScan}>
          <Text>📷 扫描车辆二维码</Text>
        </Button>
      </View>

      {scanned && (
        <View className={styles.reviewForm}>
          <Text className={styles.formTitle}>复核信息</Text>

          <View className={styles.statusCard} style={{ marginBottom: 32 }}>
            <View className={styles.statusRow}>
              <Text className={styles.statusLabel}>车辆号牌</Text>
              <Text className={styles.statusValue}>{doorInfo.vehicleNo}</Text>
            </View>
            <View className={styles.statusRow}>
              <Text className={styles.statusLabel}>当前位置</Text>
              <Text className={styles.statusValue}>{doorInfo.currentLocation}</Text>
            </View>
            <View className={styles.statusRow}>
              <Text className={styles.statusLabel}>行驶状态</Text>
              <Text className={styles.statusValue}>
                {doorInfo.isMoving ? '行驶中' : '已停车'}
              </Text>
            </View>
          </View>

          <View className={styles.formGroup}>
            <Text className={styles.formLabel}>车门状态</Text>
            <View className={styles.radioGroup}>
              <View
                className={classnames(styles.radioItem, doorStatus === 'closed' && styles.active)}
                onClick={() => setDoorStatus('closed')}
              >
                <Text className={styles.radioText}>已关闭</Text>
              </View>
              <View
                className={classnames(styles.radioItem, doorStatus === 'open' && styles.active)}
                onClick={() => setDoorStatus('open')}
              >
                <Text className={styles.radioText}>已开启</Text>
              </View>
              <View
                className={classnames(styles.radioItem, doorStatus === 'ajar' && styles.active)}
                onClick={() => setDoorStatus('ajar')}
              >
                <Text className={styles.radioText}>疑似虚掩</Text>
              </View>
            </View>
          </View>

          <View className={styles.formGroup}>
            <Text className={styles.formLabel}>封签状态</Text>
            <View className={styles.radioGroup}>
              <View
                className={classnames(styles.radioItem, sealStatus === 'intact' && styles.active)}
                onClick={() => setSealStatus('intact')}
              >
                <Text className={styles.radioText}>完好</Text>
              </View>
              <View
                className={classnames(styles.radioItem, sealStatus === 'broken' && styles.active)}
                onClick={() => setSealStatus('broken')}
              >
                <Text className={styles.radioText}>破损</Text>
              </View>
            </View>
          </View>

          <View className={styles.formGroup}>
            <Text className={styles.formLabel}>车门照片</Text>
            <View className={styles.photoGrid}>
              {doorPhoto ? (
                <View className={styles.photoPreviewItem}>
                  <Image
                    className={styles.image}
                    src={doorPhoto}
                    mode='aspectFill'
                    onClick={() => handleChooseImage('door')}
                  />
                  <View className={styles.removeBtn} onClick={(e) => handleRemovePhoto('door', e)}>
                    <Text>×</Text>
                  </View>
                </View>
              ) : (
                <Button
                  className={styles.photoUploadBtn}
                  onClick={() => handleChooseImage('door')}
                >
                  <Text className={styles.photoUploadIcon}>📷</Text>
                  <Text className={styles.photoUploadText}>拍车门</Text>
                </Button>
              )}
              {sealPhoto ? (
                <View className={styles.photoPreviewItem}>
                  <Image
                    className={styles.image}
                    src={sealPhoto}
                    mode='aspectFill'
                    onClick={() => handleChooseImage('seal')}
                  />
                  <View className={styles.removeBtn} onClick={(e) => handleRemovePhoto('seal', e)}>
                    <Text>×</Text>
                  </View>
                </View>
              ) : (
                <Button
                  className={styles.photoUploadBtn}
                  onClick={() => handleChooseImage('seal')}
                >
                  <Text className={styles.photoUploadIcon}>🔐</Text>
                  <Text className={styles.photoUploadText}>拍封签</Text>
                </Button>
              )}
            </View>
          </View>

          <View className={styles.formGroup}>
            <Text className={styles.formLabel}>备注说明</Text>
            <Textarea
              className={styles.textarea}
              placeholder='请输入备注说明（选填）'
              value={remark}
              onInput={(e) => setRemark(e.detail.value)}
              maxlength={200}
            />
          </View>

          <Button
            className={classnames(styles.submitBtn, !canSubmit && styles.disabled)}
            onClick={handleSubmit}
            disabled={!canSubmit}
          >
            <Text>提交复核</Text>
          </Button>
        </View>
      )}

      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>历史复核记录</Text>
        </View>

        {reviews.length > 0 ? (
          <View className={styles.reviewList}>
            {reviews.map((review) => (
              <View key={review.id} className={styles.reviewItem}>
                <View className={styles.reviewHeader}>
                  <Text className={styles.reviewer}>复核人：{review.reviewer}</Text>
                  <Text className={styles.reviewTime}>{formatTimeRelative(review.reviewTime)}</Text>
                </View>
                <View className={styles.reviewStatus}>
                  <StatusBadge
                    text={getDoorStatusText(review.doorStatus)}
                    color={getDoorStatusColor(review.doorStatus)}
                  />
                  <StatusBadge
                    text={getSealStatusText(review.sealStatus)}
                    color={getSealStatusColor(review.sealStatus)}
                  />
                </View>
                <View className={styles.reviewPhotos}>
                  <View className={styles.reviewPhoto}>
                    <Image
                      className={styles.image}
                      src={review.photos.door}
                      mode='aspectFill'
                    />
                  </View>
                  <View className={styles.reviewPhoto}>
                    <Image
                      className={styles.image}
                      src={review.photos.seal}
                      mode='aspectFill'
                    />
                  </View>
                </View>
                {review.remark && (
                  <Text className={styles.reviewRemark}>{review.remark}</Text>
                )}
              </View>
            ))}
          </View>
        ) : (
          <View className={styles.emptyState}>
            <Text className={styles.emptyIcon}>📋</Text>
            <Text className={styles.emptyText}>暂无复核记录</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

export default ReviewPage;
