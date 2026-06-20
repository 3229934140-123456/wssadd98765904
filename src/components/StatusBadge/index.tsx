import React from 'react'
import { View, Text } from '@tarojs/components'
import classnames from 'classnames'
import styles from './index.module.scss'

interface StatusBadgeProps {
  text: string
  color: string
  bgColor?: string
  pulse?: boolean
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ text, color, bgColor, pulse = false }) => {
  const backgroundColor = bgColor || `${color}15`
  
  return (
    <View
      className={classnames(styles.badge, pulse && styles.pulse)}
      style={{ color, backgroundColor }}
    >
      <Text>{text}</Text>
    </View>
  )
}

export default StatusBadge
