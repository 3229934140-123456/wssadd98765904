import React, { useEffect } from 'react'
import { View, Text, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import classnames from 'classnames'
import type { AlarmReason, DoorInfo } from '@/types'
import { formatTime } from '@/utils'
import { useVibrate } from '@/hooks/useVibrate'
import { useSpeech } from '@/hooks/useSpeech'
import styles from './index.module.scss'

interface AlarmPopupProps {
  visible: boolean
  doorInfo: DoorInfo
  alarmType: 'open' | 'ajar'
  onSelectReason: (reason: AlarmReason) => void
}

const AlarmPopup: React.FC<AlarmPopupProps> = ({ visible, doorInfo, alarmType, onSelectReason }) => {
  const { vibratePattern } = useVibrate()
  const { speakAlarm, stop: stopSpeech } = useSpeech()
  
  useEffect(() => {
    if (visible) {
      vibratePattern([300, 100, 300, 100, 300, 100, 300])
      const vibrateInterval = setInterval(() => {
        vibratePattern([200, 100, 200])
      }, 3000)
      
      const speechSuccess = speakAlarm(alarmType)
      console.log('[AlarmPopup] Speech played:', speechSuccess)
      
      try {
        Taro.showToast({
          title: alarmType === 'open' ? '车门异常开启！' : '车门疑似虚掩！',
          icon: 'none',
          duration: 3000
        })
      } catch (err) {
        console.error('[AlarmPopup] Toast error:', err)
      }
      
      return () => {
        clearInterval(vibrateInterval)
        stopSpeech()
      }
    }
  }, [visible, vibratePattern, speakAlarm, stopSpeech, alarmType])
  
  if (!visible) return null
  
  const handleReason = (reason: AlarmReason) => {
    console.log('[AlarmPopup] Reason selected:', reason)
    onSelectReason(reason)
  }
  
  const titleText = alarmType === 'open' ? '车门异常开启' : '车门疑似虚掩'
  const subtitleText = alarmType === 'open' ? '请立即选择原因并进行处理' : '请检查车门状态并选择原因'
  
  return (
    <View className={styles.mask} catchMove>
      <View className={classnames(styles.popup, alarmType === 'ajar' && styles.popupWarning)}>
        <View className={styles.header}>
          <View className={classnames(styles.iconWrapper, alarmType === 'ajar' && styles.iconWrapperWarning)}>
            <Text className={styles.icon}>{alarmType === 'open' ? '🚨' : '⚠️'}</Text>
          </View>
          <Text className={classnames(styles.title, alarmType === 'ajar' && styles.titleWarning)}>{titleText}</Text>
          <Text className={styles.subtitle}>{subtitleText}</Text>
        </View>
        
        <View className={styles.infoSection}>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>发生时间</Text>
            <Text className={styles.infoValue}>{formatTime(doorInfo.lastOpenTime)}</Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>当前位置</Text>
            <Text className={styles.infoValue}>{doorInfo.currentLocation}</Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>车辆状态</Text>
            <Text className={styles.infoValue} style={{ color: doorInfo.isMoving ? '#f53f3f' : '#86909c' }}>
              {doorInfo.isMoving ? '⚠️ 行驶中' : '已停车'}
            </Text>
          </View>
        </View>
        
        <Text className={styles.reasonTitle}>请选择开门原因</Text>
        
        <View className={styles.reasonButtons}>
          <Button 
            className={classnames(styles.reasonBtn, styles.loadingBtn)}
            onClick={() => handleReason('loading')}
          >
            <Text>临时装卸</Text>
          </Button>
          <Button 
            className={classnames(styles.reasonBtn, styles.misoperationBtn)}
            onClick={() => handleReason('misoperation')}
          >
            <Text>误触</Text>
          </Button>
          <Button 
            className={classnames(styles.reasonBtn, styles.abnormalBtn)}
            onClick={() => handleReason('abnormal')}
          >
            <Text>异常停车</Text>
          </Button>
        </View>
      </View>
    </View>
  )
}

export default AlarmPopup
