import React from 'react'
import { View, Text } from '@tarojs/components'
import classnames from 'classnames'
import type { DoorInfo } from '@/types'
import { getDoorStatusText, getDoorStatusColor, getTempStatusColor, formatTimeRelative } from '@/utils'
import StatusBadge from '@/components/StatusBadge'
import styles from './index.module.scss'

interface DoorStatusCardProps {
  doorInfo: DoorInfo
  currentTemp: number
}

const DoorStatusCard: React.FC<DoorStatusCardProps> = ({ doorInfo, currentTemp }) => {
  const statusText = getDoorStatusText(doorInfo.status)
  const statusColor = getDoorStatusColor(doorInfo.status)
  const tempColor = getTempStatusColor(currentTemp)
  
  const cardClass = classnames(styles.card, {
    [styles.danger]: doorInfo.status === 'open',
    [styles.warning]: doorInfo.status === 'ajar'
  })
  
  const getStatusIcon = () => {
    switch (doorInfo.status) {
      case 'closed': return '🔒'
      case 'open': return '🚨'
      case 'ajar': return '⚠️'
      default: return '🔒'
    }
  }
  
  return (
    <View className={cardClass}>
      <View className={styles.header}>
        <View className={styles.vehicleInfo}>
          <Text className={styles.vehicleNo}>{doorInfo.vehicleNo}</Text>
          <StatusBadge 
            text={doorInfo.isMoving ? '行驶中' : '已停车'} 
            color={doorInfo.isMoving ? '#165dff' : '#86909c'}
            pulse={doorInfo.isMoving}
          />
        </View>
        <View className={styles.statusIndicator}>
          <View>
            <View className={classnames(styles.statusIcon, styles[doorInfo.status])}>
              <Text>{getStatusIcon()}</Text>
            </View>
            <Text className={styles.statusText} style={{ color: statusColor }}>{statusText}</Text>
          </View>
        </View>
      </View>
      
      <View className={styles.infoRow}>
        <Text className={styles.infoLabel}>当前位置</Text>
        <Text className={styles.infoValue}>{doorInfo.currentLocation}</Text>
      </View>
      
      <View className={styles.infoRow}>
        <Text className={styles.infoLabel}>最近开门</Text>
        <Text className={styles.infoValue}>{formatTimeRelative(doorInfo.lastOpenTime)}</Text>
      </View>
      
      <View className={styles.infoRow}>
        <Text className={styles.infoLabel}>最近关门</Text>
        <Text className={styles.infoValue}>{formatTimeRelative(doorInfo.lastCloseTime)}</Text>
      </View>
      
      <View className={styles.infoRow}>
        <Text className={styles.infoLabel}>车厢温度</Text>
        <View className={styles.tempBadge} style={{ backgroundColor: tempColor }}>
          <Text>{currentTemp.toFixed(1)}°C</Text>
        </View>
      </View>
    </View>
  )
}

export default DoorStatusCard
