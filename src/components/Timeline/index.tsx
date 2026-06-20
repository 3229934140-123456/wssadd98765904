import React from 'react'
import { View, Text } from '@tarojs/components'
import type { TimelineEvent } from '@/types'
import { formatTime } from '@/utils'
import styles from './index.module.scss'

interface TimelineProps {
  events: TimelineEvent[]
}

const eventIcons: Record<TimelineEvent['type'], string> = {
  status_change: '🚪',
  reason_select: '📝',
  photo_taken: '📷',
  lock_confirm: '🔒',
  submit_handle: '✅',
  review_compare: '📋'
}

const Timeline: React.FC<TimelineProps> = ({ events }) => {
  if (!events || events.length === 0) return null

  const sortedEvents = [...events].sort((a, b) => 
    new Date(a.time).getTime() - new Date(b.time).getTime()
  )

  return (
    <View className={styles.container}>
      <Text className={styles.title}>处置时间线</Text>
      {sortedEvents.map((event, index) => (
        <View key={`${event.time}-${index}`} className={styles.item}>
          <View className={styles.leftCol}>
            <View className={styles.dot}>
              <Text className={styles.dotIcon}>{eventIcons[event.type] || '📍'}</Text>
            </View>
            {index < sortedEvents.length - 1 && <View className={styles.line} />}
          </View>
          <View className={styles.rightCol}>
            <View className={styles.eventHeader}>
              <Text className={styles.eventTitle}>{event.title}</Text>
              <Text className={styles.eventTime}>{formatTime(event.time)}</Text>
            </View>
            {event.description && (
              <Text className={styles.eventDesc}>{event.description}</Text>
            )}
            {event.operator && (
              <Text className={styles.eventOperator}>操作人：{event.operator}</Text>
            )}
          </View>
        </View>
      ))}
    </View>
  )
}

export default Timeline
