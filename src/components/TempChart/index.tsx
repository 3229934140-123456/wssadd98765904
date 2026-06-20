import React from 'react'
import { View, Text } from '@tarojs/components'
import classnames from 'classnames'
import type { TempRecord } from '@/types'
import { getTempStatusColor } from '@/utils'
import styles from './index.module.scss'

interface TempChartProps {
  records: TempRecord[]
}

const TempChart: React.FC<TempChartProps> = ({ records }) => {
  const currentTemp = records.length > 0 ? records[records.length - 1].temperature : 0
  const currentTempColor = getTempStatusColor(currentTemp)
  
  const minTemp = Math.min(...records.map(r => r.temperature)) - 2
  const maxTemp = Math.max(...records.map(r => r.temperature)) + 2
  const tempRange = maxTemp - minTemp
  
  const getBarHeight = (temp: number) => {
    const percentage = ((temp - minTemp) / tempRange) * 100
    return `${Math.max(20, percentage)}%`
  }
  
  const getTempLevel = (temp: number): 'normal' | 'warning' | 'danger' => {
    if (temp > -15) return 'danger'
    if (temp > -17) return 'warning'
    return 'normal'
  }
  
  return (
    <View className={styles.card}>
      <View className={styles.header}>
        <Text className={styles.title}>温度变化</Text>
        <Text className={styles.currentTemp} style={{ color: currentTempColor }}>
          {currentTemp.toFixed(1)}°C
        </Text>
      </View>
      
      <View className={styles.chartContainer}>
        <View className={styles.chartBg} />
        <View className={styles.chartLine}>
          {records.map((record, index) => {
            const level = getTempLevel(record.temperature)
            return (
              <View
                key={index}
                className={classnames(styles.bar, styles[level])}
                style={{
                  height: getBarHeight(record.temperature),
                  backgroundColor: getTempStatusColor(record.temperature)
                }}
              >
                <Text className={styles.barValue} style={{ color: getTempStatusColor(record.temperature) }}>
                  {record.temperature.toFixed(1)}°
                </Text>
                <Text className={styles.barLabel}>{record.time}</Text>
              </View>
            )
          })}
        </View>
      </View>
      
      <View className={styles.legend}>
        <View className={classnames(styles.legendItem, styles.normal)}>
          <Text>正常（≤-17°C）</Text>
        </View>
        <View className={classnames(styles.legendItem, styles.warning)}>
          <Text>预警（-17~-15°C）</Text>
        </View>
        <View className={classnames(styles.legendItem, styles.danger)}>
          <Text>异常（>-15°C）</Text>
        </View>
      </View>
    </View>
  )
}

export default TempChart
