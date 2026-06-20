import React, { useState, useMemo } from 'react';
import { View, Text, Button, Image, Textarea, ScrollView, Input } from '@tarojs/components';
import Taro, { usePullDownRefresh, useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import { useDoor } from '@/store/DoorContext';
import StatusBadge from '@/components/StatusBadge';
import type { DoorStatus, AlarmRecord } from '@/types';
import {
  getDoorStatusText,
  getDoorStatusColor,
  getSealStatusText,
  getSealStatusColor,
  formatTimeRelative,
  formatTime
} from '@/utils';
import styles from './index.module.scss';

const ReviewPage: React.FC = () => {
  const { doorInfo, reviews, submitReview, getLastResolvedAlarm } = useDoor();
  
  const [scanned, setScanned] = useState(false);
  const [doorStatus, setDoorStatus] = useState<DoorStatus>('closed');
  const [sealStatus, setSealStatus] = useState<'intact' | 'broken'>('intact');
  const [compareResult, setCompareResult] = useState<'consistent' | 'inconsistent'>('consistent');
  const [remark, setRemark] = useState('');
  const [doorPhoto, setDoorPhoto] = useState('');
  const [sealPhoto, setSealPhoto] = useState('');
  const [lastAlarm, setLastAlarm] = useState<AlarmRecord | undefined>();
  const [refreshing, setRefreshing] = useState(false);
  
  const [filterVehicleNo, setFilterVehicleNo] = useState('');
  const [filterAlarmId, setFilterAlarmId] = useState('');
  const [expandedReviewId, setExpandedReviewId] = useState<string | null>(null);

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

  const filteredReviews = useMemo(() => {
    return reviews.filter(r => {
      if (filterVehicleNo && !r.vehicleNo.includes(filterVehicleNo)) return false;
      if (filterAlarmId && (!r.lastAlarmId || !r.lastAlarmId.includes(filterAlarmId))) return false;
      return true;
    });
  }, [reviews, filterVehicleNo, filterAlarmId]);

  const toggleExpand = (reviewId: string) => {
    setExpandedReviewId(prev => prev === reviewId ? null : reviewId);
  };

  const handleScan = async () => {
    try {
      const res = await Taro.scanCode({
        scanType: ['qrCode', 'barCode']
      });
      console.log('[ReviewPage] Scan result:', res.result);
      
      const lastResolved = getLastResolvedAlarm();
      setLastAlarm(lastResolved);
      
      setScanned(true);
      setDoorStatus(doorInfo.status);
      
      if (lastResolved?.photos) {
        setCompareResult('consistent');
      }
      
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

  const handlePreviewImage = (url: string) => {
    Taro.previewImage({
      urls: [url],
      current: url
    });
  };

  const getLastDoorStatus = (): DoorStatus | undefined => {
    if (!lastAlarm) return undefined;
    if (lastAlarm.isRelocked) return 'closed';
    return lastAlarm.type === 'open' ? 'open' : 'ajar';
  };

  const handleSubmit = () => {
    if (!doorPhoto || !sealPhoto) {
      Taro.showToast({ title: '请拍摄完整照片', icon: 'none' });
      return;
    }

    const success = submitReview({
      doorId: doorInfo.id,
      vehicleNo: doorInfo.vehicleNo,
      reviewer: '李站长',
      doorStatus,
      sealStatus,
      compareResult,
      photos: {
        door: doorPhoto,
        seal: sealPhoto
      },
      lastAlarmPhotos: lastAlarm?.photos ? {
        door: lastAlarm.photos.door,
        seal: lastAlarm.photos.seal
      } : undefined,
      lastDoorStatus: getLastDoorStatus(),
      lastAlarmId: lastAlarm?.id,
      remark
    });

    if (success) {
      Taro.showToast({ title: '复核提交成功', icon: 'success' });
      setScanned(false);
      setDoorStatus('closed');
      setSealStatus('intact');
      setCompareResult('consistent');
      setRemark('');
      setDoorPhoto('');
      setSealPhoto('');
      setLastAlarm(undefined);
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
          <Text className={styles.formTitle}>车辆信息</Text>
          
          <View className={styles.statusCard}>
            <View className={styles.statusRow}>
              <Text className={styles.statusLabel}>车辆号牌</Text>
              <Text className={styles.statusValue} style={{ fontWeight: 600 }}>
                {doorInfo.vehicleNo}
              </Text>
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
        </View>
      )}

      {scanned && lastAlarm && (
        <View className={styles.compareSection}>
          <View className={styles.compareHeader}>
            <Text className={styles.sectionTitle}>上次处置信息</Text>
            <Text className={styles.compareSubtitle}>
              告警ID：{lastAlarm.id}
            </Text>
          </View>

          <View className={styles.lastAlarmInfo}>
            <View className={styles.lastAlarmRow}>
              <Text className={styles.lastAlarmLabel}>处置时间</Text>
              <Text className={styles.lastAlarmValue}>
                {formatTime(lastAlarm.handleTime || lastAlarm.occurTime)}
              </Text>
            </View>
            <View className={styles.lastAlarmRow}>
              <Text className={styles.lastAlarmLabel}>处理人</Text>
              <Text className={styles.lastAlarmValue}>{lastAlarm.handler || '司机'}</Text>
            </View>
            <View className={styles.lastAlarmRow}>
              <Text className={styles.lastAlarmLabel}>门磁状态</Text>
              <StatusBadge
                text={getDoorStatusText(getLastDoorStatus() || 'closed')}
                color={getDoorStatusColor(getLastDoorStatus() || 'closed')}
              />
            </View>
            <View className={styles.lastAlarmRow}>
              <Text className={styles.lastAlarmLabel}>锁闭结果</Text>
              <StatusBadge
                text={lastAlarm.isRelocked ? '已重新锁闭' : '未锁闭'}
                color={lastAlarm.isRelocked ? '#00b42a' : '#f53f3f'}
              />
            </View>
          </View>
        </View>
      )}

      {scanned && lastAlarm?.photos && (
        <View className={styles.compareSection}>
          <View className={styles.compareHeader}>
            <Text className={styles.sectionTitle}>封签照片对比</Text>
            <StatusBadge
              text={compareResult === 'consistent' ? '状态一致' : '状态不一致'}
              color={compareResult === 'consistent' ? '#00b42a' : '#f53f3f'}
            />
          </View>
          
          <View className={styles.compareGrid}>
            <View className={styles.compareItem}>
              <View className={styles.compareLabel}>
                <Text className={styles.compareLabelText}>上次封签照片</Text>
              </View>
              <View
                className={styles.comparePhoto}
                onClick={() => handlePreviewImage(lastAlarm.photos!.seal)}
              >
                <Image
                  className={styles.image}
                  src={lastAlarm.photos.seal}
                  mode='aspectFill'
                />
              </View>
            </View>
            
            <View className={styles.compareItem}>
              <View className={styles.compareLabel}>
                <Text className={styles.compareLabelText}>现场封签照片</Text>
                <Text className={styles.compareLabelHint}>点击拍照</Text>
              </View>
              {sealPhoto ? (
                <View
                  className={styles.comparePhoto}
                  onClick={() => handleChooseImage('seal')}
                >
                  <Image
                    className={styles.image}
                    src={sealPhoto}
                    mode='aspectFill'
                  />
                  <View
                    className={styles.removeBtn}
                    onClick={(e) => handleRemovePhoto('seal', e)}
                  >
                    <Text>×</Text>
                  </View>
                </View>
              ) : (
                <Button
                  className={styles.photoUploadBtn}
                  style={{ height: '200rpx' }}
                  onClick={() => handleChooseImage('seal')}
                >
                  <Text className={styles.photoUploadIcon}>📷</Text>
                  <Text className={styles.photoUploadText}>拍封签</Text>
                </Button>
              )}
            </View>
          </View>
          
          <View className={styles.compareResultSection}>
            <Text className={styles.formLabel}>封签对比结果</Text>
            <View className={styles.radioGroup}>
              <View
                className={classnames(styles.radioItem, compareResult === 'consistent' && styles.active)}
                onClick={() => setCompareResult('consistent')}
              >
                <Text className={styles.radioIcon}>✅</Text>
                <Text className={styles.radioText}>一致</Text>
              </View>
              <View
                className={classnames(styles.radioItem, compareResult === 'inconsistent' && styles.active)}
                onClick={() => setCompareResult('inconsistent')}
              >
                <Text className={styles.radioIcon}>⚠️</Text>
                <Text className={styles.radioText}>不一致</Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {scanned && (
        <View className={styles.reviewForm}>
          <Text className={styles.formTitle}>复核确认</Text>

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

          {!lastAlarm?.photos && (
            <View className={styles.formGroup}>
              <Text className={styles.formLabel}>现场照片</Text>
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
                {!sealPhoto && (
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
          )}

          {lastAlarm?.photos && (
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
              </View>
            </View>
          )}

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

        <View className={styles.filterBar}>
          <View className={styles.filterItem}>
            <Text className={styles.filterLabel}>车辆号</Text>
            <Input
              className={styles.filterInput}
              placeholder='输入车辆号'
              value={filterVehicleNo}
              onInput={(e) => setFilterVehicleNo(e.detail.value)}
            />
          </View>
          <View className={styles.filterItem}>
            <Text className={styles.filterLabel}>告警ID</Text>
            <Input
              className={styles.filterInput}
              placeholder='输入告警ID'
              value={filterAlarmId}
              onInput={(e) => setFilterAlarmId(e.detail.value)}
            />
          </View>
        </View>

        {filteredReviews.length > 0 ? (
          <View className={styles.reviewList}>
            {filteredReviews.map((review) => {
              const isExpanded = expandedReviewId === review.id;
              return (
                <View key={review.id} className={styles.reviewItem}>
                  <View
                    className={styles.reviewHeader}
                    onClick={() => toggleExpand(review.id)}
                  >
                    <View>
                      <Text className={styles.reviewer}>{review.vehicleNo}</Text>
                      <Text className={styles.reviewTime}>
                        复核人：{review.reviewer} · {formatTimeRelative(review.reviewTime)}
                      </Text>
                    </View>
                    <View className={styles.reviewHeaderRight}>
                      <StatusBadge
                        text={review.compareResult === 'consistent' ? '一致' : '不一致'}
                        color={review.compareResult === 'consistent' ? '#00b42a' : '#f53f3f'}
                      />
                      <Text className={classnames(styles.expandIcon, isExpanded && styles.expandIconOpen)}>›</Text>
                    </View>
                  </View>
                  <View className={styles.reviewStatus}>
                    <View className={styles.reviewStatusGroup}>
                      <Text className={styles.reviewStatusLabel}>现场</Text>
                      <StatusBadge
                        text={getDoorStatusText(review.doorStatus)}
                        color={getDoorStatusColor(review.doorStatus)}
                      />
                      <StatusBadge
                        text={getSealStatusText(review.sealStatus)}
                        color={getSealStatusColor(review.sealStatus)}
                      />
                    </View>
                    {review.lastDoorStatus && (
                      <View className={styles.reviewStatusGroup}>
                        <Text className={styles.reviewStatusLabel}>上次</Text>
                        <StatusBadge
                          text={getDoorStatusText(review.lastDoorStatus)}
                          color={getDoorStatusColor(review.lastDoorStatus)}
                        />
                      </View>
                    )}
                  </View>
                  
                  {isExpanded && (
                    <View className={styles.expandedContent}>
                      <View className={styles.expandInfoRow}>
                        <Text className={styles.expandInfoLabel}>复核时间</Text>
                        <Text className={styles.expandInfoValue}>{formatTime(review.reviewTime)}</Text>
                      </View>
                      {review.lastAlarmId && (
                        <View className={styles.expandInfoRow}>
                          <Text className={styles.expandInfoLabel}>关联告警</Text>
                          <Text className={styles.expandInfoValue}>{review.lastAlarmId}</Text>
                        </View>
                      )}
                      <View className={styles.expandInfoRow}>
                        <Text className={styles.expandInfoLabel}>对比结果</Text>
                        <Text
                          className={styles.expandInfoValue}
                          style={{ color: review.compareResult === 'consistent' ? '#00b42a' : '#f53f3f', fontWeight: 600 }}
                        >
                          {review.compareResult === 'consistent' ? '封签状态一致' : '封签状态不一致'}
                        </Text>
                      </View>

                      <View className={styles.expandSectionTitle}>
                        <Text className={styles.expandSectionTitleText}>上次处置信息</Text>
                      </View>
                      <View className={styles.expandInfoRow}>
                        <Text className={styles.expandInfoLabel}>门磁状态</Text>
                        <StatusBadge
                          text={review.lastDoorStatus ? getDoorStatusText(review.lastDoorStatus) : '无记录'}
                          color={review.lastDoorStatus ? getDoorStatusColor(review.lastDoorStatus) : '#86909c'}
                        />
                      </View>

                      <View className={styles.expandSectionTitle}>
                        <Text className={styles.expandSectionTitleText}>现场照片</Text>
                      </View>
                      <View className={styles.reviewPhotos}>
                        <View className={styles.reviewPhoto} onClick={() => handlePreviewImage(review.photos.door)}>
                          <Image
                            className={styles.image}
                            src={review.photos.door}
                            mode='aspectFill'
                          />
                          <Text className={styles.reviewComparePhotoLabel}>车门</Text>
                        </View>
                        <View className={styles.reviewPhoto} onClick={() => handlePreviewImage(review.photos.seal)}>
                          <Image
                            className={styles.image}
                            src={review.photos.seal}
                            mode='aspectFill'
                          />
                          <Text className={styles.reviewComparePhotoLabel}>封签</Text>
                        </View>
                      </View>

                      {review.lastAlarmPhotos && (
                        <>
                          <View className={styles.expandSectionTitle}>
                            <Text className={styles.expandSectionTitleText}>上次处置照片</Text>
                          </View>
                          <View className={styles.reviewPhotos}>
                            <View className={styles.reviewPhoto} onClick={() => handlePreviewImage(review.lastAlarmPhotos!.door)}>
                              <Image
                                className={styles.image}
                                src={review.lastAlarmPhotos.door}
                                mode='aspectFill'
                              />
                              <Text className={styles.reviewComparePhotoLabel}>车门</Text>
                            </View>
                            <View className={styles.reviewPhoto} onClick={() => handlePreviewImage(review.lastAlarmPhotos!.seal)}>
                              <Image
                                className={styles.image}
                                src={review.lastAlarmPhotos.seal}
                                mode='aspectFill'
                              />
                              <Text className={styles.reviewComparePhotoLabel}>封签</Text>
                            </View>
                          </View>
                        </>
                      )}
                      
                      {review.remark && (
                        <View className={styles.expandInfoRow}>
                          <Text className={styles.expandInfoLabel}>复核备注</Text>
                          <Text className={styles.expandInfoValue}>{review.remark}</Text>
                        </View>
                      )}
                    </View>
                  )}
                  
                  {!isExpanded && review.remark && (
                    <Text className={styles.reviewRemark}>{review.remark}</Text>
                  )}
                </View>
              );
            })}
          </View>
        ) : (
          <View className={styles.emptyState}>
            <Text className={styles.emptyIcon}>📋</Text>
            <Text className={styles.emptyText}>
              {reviews.length === 0 ? '暂无复核记录' : '没有符合筛选条件的记录'}
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

export default ReviewPage;
