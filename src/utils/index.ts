import dayjs from 'dayjs'
import type { DoorStatus } from '@/types'

export const formatTime = (time: string): string => {
  return dayjs(time).format('YYYY-MM-DD HH:mm:ss')
}

export const formatTimeRelative = (time: string): string => {
  const now = dayjs()
  const target = dayjs(time)
  const diffMinutes = now.diff(target, 'minute')
  
  if (diffMinutes < 1) return '刚刚'
  if (diffMinutes < 60) return `${diffMinutes}分钟前`
  if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}小时前`
  return formatTime(time)
}

export const getDoorStatusText = (status: DoorStatus): string => {
  const map = {
    closed: '已关闭',
    open: '已开启',
    ajar: '疑似虚掩'
  }
  return map[status]
}

export const getDoorStatusColor = (status: DoorStatus): string => {
  const map = {
    closed: '#00b42a',
    open: '#f53f3f',
    ajar: '#ff7d00'
  }
  return map[status]
}

export const getTempStatusColor = (temp: number): string => {
  if (temp > -15) return '#f53f3f'
  if (temp > -17) return '#ff7d00'
  return '#00b42a'
}

export const getAlarmLevelText = (level: string): string => {
  return level === 'danger' ? '高危' : '警告'
}

export const getAlarmLevelColor = (level: string): string => {
  return level === 'danger' ? '#f53f3f' : '#ff7d00'
}

export const getAlarmStatusText = (status: string): string => {
  const map = {
    pending: '待处理',
    processing: '处理中',
    resolved: '已处理'
  }
  return map[status as keyof typeof map] || status
}

export const getAlarmStatusColor = (status: string): string => {
  const map = {
    pending: '#f53f3f',
    processing: '#ff7d00',
    resolved: '#00b42a'
  }
  return map[status as keyof typeof map] || '#86909c'
}

export const getReasonText = (reason: string): string => {
  const map = {
    loading: '临时装卸',
    misoperation: '误触',
    abnormal: '异常停车'
  }
  return map[reason as keyof typeof map] || reason
}

export const getSealStatusText = (status: string): string => {
  return status === 'intact' ? '封签完好' : '封签破损'
}

export const getSealStatusColor = (status: string): string => {
  return status === 'intact' ? '#00b42a' : '#f53f3f'
}

export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}
