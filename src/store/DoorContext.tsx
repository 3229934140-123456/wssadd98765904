import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import type { DoorInfo, TempRecord, AlarmRecord, ReviewRecord, AlarmReason, DoorStatus, TimelineEvent } from '@/types'
import { mockDoorInfo, mockTempRecords, mockAlarms, mockReviews } from '@/data/mock'
import { generateId, getDoorStatusText } from '@/utils'

interface DoorContextType {
  doorInfo: DoorInfo
  tempRecords: TempRecord[]
  alarms: AlarmRecord[]
  reviews: ReviewRecord[]
  currentAlarm: AlarmRecord | null
  showAlarmPopup: boolean
  setShowAlarmPopup: (show: boolean) => void
  triggerAlarm: (type: 'open' | 'ajar') => void
  handleAlarmReason: (reason: AlarmReason) => void
  updateDoorStatus: (status: DoorStatus) => void
  submitAlarmHandle: (alarmId: string, data: Partial<AlarmRecord>) => boolean
  submitReview: (data: Omit<ReviewRecord, 'id' | 'reviewTime'>) => boolean
  getPendingAlarms: () => AlarmRecord[]
  getLastResolvedAlarm: () => AlarmRecord | undefined
  getAlarmById: (id: string) => AlarmRecord | undefined
  addTimelineEvent: (alarmId: string, event: Omit<TimelineEvent, 'time'>) => void
  addAlarmTimeline: (alarmId: string, event: Omit<TimelineEvent, 'time'>) => void
}

const DoorContext = createContext<DoorContextType | null>(null)

export const DoorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [doorInfo, setDoorInfo] = useState<DoorInfo>(mockDoorInfo)
  const [tempRecords] = useState<TempRecord[]>(mockTempRecords)
  const [alarms, setAlarms] = useState<AlarmRecord[]>(mockAlarms)
  const [reviews, setReviews] = useState<ReviewRecord[]>(mockReviews)
  const [currentAlarm, setCurrentAlarm] = useState<AlarmRecord | null>(null)
  const [showAlarmPopup, setShowAlarmPopup] = useState(false)
  
  const prevStatusRef = useRef<DoorStatus>(mockDoorInfo.status)

  const createAlarm = useCallback((type: 'open' | 'ajar', prevStatus: DoorStatus) => {
    const now = new Date().toISOString()
    const newAlarm: AlarmRecord = {
      id: generateId(),
      doorId: doorInfo.id,
      type,
      level: type === 'open' ? 'danger' : 'warning',
      occurTime: now,
      location: doorInfo.currentLocation,
      status: 'pending',
      timeline: [{
        type: 'status_change',
        title: `门磁状态变更`,
        description: `从${getDoorStatusText(prevStatus)}变为${getDoorStatusText(type === 'open' ? 'open' : 'ajar')}`,
        operator: '设备同步',
        time: now
      }]
    }
    
    setAlarms(prev => [newAlarm, ...prev])
    setCurrentAlarm(newAlarm)
    setShowAlarmPopup(true)
    
    console.log('[DoorContext] Alarm created:', newAlarm.id, type, 'from status change')
    return newAlarm
  }, [doorInfo.id, doorInfo.currentLocation])

  useEffect(() => {
    const prevStatus = prevStatusRef.current
    const currentStatus = doorInfo.status
    
    if (prevStatus !== currentStatus && currentStatus !== 'closed') {
      const type = currentStatus === 'open' ? 'open' : 'ajar'
      createAlarm(type, prevStatus)
    }
    
    prevStatusRef.current = currentStatus
  }, [doorInfo.status, createAlarm])

  const triggerAlarm = useCallback((type: 'open' | 'ajar') => {
    console.log('[DoorContext] triggerAlarm called:', type)
    
    if (doorInfo.status === type) {
      setDoorInfo(prev => ({ ...prev, status: 'closed' }))
      setTimeout(() => {
        setDoorInfo(prev => {
          const now = new Date().toISOString()
          return {
            ...prev,
            status: type as DoorStatus,
            lastOpenTime: type === 'open' ? now : prev.lastOpenTime
          }
        })
      }, 100)
    } else {
      setDoorInfo(prev => {
        const now = new Date().toISOString()
        return {
          ...prev,
          status: type as DoorStatus,
          lastOpenTime: type === 'open' ? now : prev.lastOpenTime
        }
      })
    }
  }, [doorInfo.status])

  const addAlarmTimeline = useCallback((alarmId: string, event: Omit<TimelineEvent, 'time'>) => {
    const timelineEvent: TimelineEvent = {
      ...event,
      time: new Date().toISOString()
    }
    setAlarms(prev => prev.map(alarm =>
      alarm.id === alarmId
        ? { ...alarm, timeline: [...(alarm.timeline || []), timelineEvent] }
        : alarm
    ))
    if (currentAlarm?.id === alarmId) {
      setCurrentAlarm(prev => prev ? { ...prev, timeline: [...(prev.timeline || []), timelineEvent] } : null)
    }
  }, [currentAlarm])

  const addTimelineEvent = addAlarmTimeline

  const handleAlarmReason = useCallback((reason: AlarmReason) => {
    if (!currentAlarm) return
    
    const alarmId = currentAlarm.id
    const reasonText = reason === 'loading' ? '临时装卸' : reason === 'misoperation' ? '误触' : '异常停车'
    
    setAlarms(prev => prev.map(alarm => {
      if (alarm.id !== alarmId) return alarm
      const newTimeline = [...(alarm.timeline || []), {
        type: 'reason_select' as const,
        title: '告警原因选择',
        description: reasonText,
        operator: '张师傅',
        time: new Date().toISOString()
      }]
      return { ...alarm, reason, status: 'processing' as const, timeline: newTimeline }
    }))
    
    setCurrentAlarm(prev => prev ? {
      ...prev,
      reason,
      status: 'processing' as const,
      timeline: [...(prev.timeline || []), {
        type: 'reason_select' as const,
        title: '告警原因选择',
        description: reasonText,
        operator: '张师傅',
        time: new Date().toISOString()
      }]
    } : null)
    setShowAlarmPopup(false)
    
    console.log('[DoorContext] Alarm reason selected:', alarmId, reason)
  }, [currentAlarm])

  const updateDoorStatus = useCallback((status: DoorStatus) => {
    console.log('[DoorContext] updateDoorStatus:', status)
    setDoorInfo(prev => ({
      ...prev,
      status,
      lastCloseTime: status === 'closed' ? new Date().toISOString() : prev.lastCloseTime,
      lastOpenTime: status === 'open' ? new Date().toISOString() : prev.lastOpenTime
    }))
  }, [])

  const submitAlarmHandle = useCallback((alarmId: string, data: Partial<AlarmRecord>): boolean => {
    try {
      const now = new Date().toISOString()
      setAlarms(prev => prev.map(alarm => {
        if (alarm.id !== alarmId) return alarm
        const newTimeline = [...(alarm.timeline || [])]
        if (data.photos) {
          newTimeline.push({
            type: 'photo_taken' as const,
            title: '现场拍照取证',
            description: '车门、封签、环境照片已上传',
            operator: data.handler || '张师傅',
            time: now
          })
        }
        if (data.isRelocked !== undefined) {
          newTimeline.push({
            type: 'lock_confirm' as const,
            title: '锁闭结果确认',
            description: data.isRelocked ? '已重新锁闭车门' : '未锁闭车门',
            operator: data.handler || '张师傅',
            time: now
          })
        }
        newTimeline.push({
          type: 'submit_handle' as const,
          title: '处置记录已提交',
          description: data.remark || '处置完成',
          operator: data.handler || '张师傅',
          time: now
        })
        return {
          ...alarm,
          ...data,
          status: 'resolved' as const,
          handleTime: now,
          timeline: newTimeline
        }
      }))
      
      if (data.isRelocked) {
        prevStatusRef.current = 'closed'
        setDoorInfo(prev => ({ ...prev, status: 'closed', lastCloseTime: new Date().toISOString() }))
      }
      
      if (currentAlarm?.id === alarmId) {
        setCurrentAlarm(null)
      }
      
      console.log('[DoorContext] Alarm handled:', alarmId, 'status: resolved')
      return true
    } catch (err) {
      console.error('[DoorContext] Submit alarm handle error:', err)
      return false
    }
  }, [currentAlarm])

  const submitReview = useCallback((data: Omit<ReviewRecord, 'id' | 'reviewTime'>): boolean => {
    try {
      const now = new Date().toISOString()
      const newReview: ReviewRecord = {
        ...data,
        id: generateId(),
        reviewTime: now
      }
      setReviews(prev => [newReview, ...prev])
      
      if (data.lastAlarmId) {
        setAlarms(prevAlarms => prevAlarms.map(alarm => {
          if (alarm.id !== data.lastAlarmId) return alarm
          const newTimeline = [...(alarm.timeline || []), {
            type: 'review_compare' as const,
            title: '到站复核完成',
            description: `对比结果：${data.compareResult === 'consistent' ? '一致' : '不一致'}，门磁状态：${getDoorStatusText(data.doorStatus)}`,
            operator: data.reviewer,
            time: now
          }]
          return { ...alarm, timeline: newTimeline }
        }))
      }
      
      console.log('[DoorContext] Review submitted:', newReview.id)
      return true
    } catch (err) {
      console.error('[DoorContext] Submit review error:', err)
      return false
    }
  }, [])

  const getPendingAlarms = useCallback(() => {
    return alarms.filter(a => a.status === 'pending')
  }, [alarms])

  const getLastResolvedAlarm = useCallback(() => {
    return alarms.find(a => a.status === 'resolved' && a.photos)
  }, [alarms])

  const getAlarmById = useCallback((id: string) => {
    return alarms.find(a => a.id === id)
  }, [alarms])

  return (
    <DoorContext.Provider value={{
      doorInfo,
      tempRecords,
      alarms,
      reviews,
      currentAlarm,
      showAlarmPopup,
      setShowAlarmPopup,
      triggerAlarm,
      handleAlarmReason,
      updateDoorStatus,
      submitAlarmHandle,
      submitReview,
      getPendingAlarms,
      getLastResolvedAlarm,
      getAlarmById,
      addTimelineEvent,
      addAlarmTimeline
    }}>
      {children}
    </DoorContext.Provider>
  )
}

export const useDoor = () => {
  const context = useContext(DoorContext)
  if (!context) {
    throw new Error('useDoor must be used within DoorProvider')
  }
  return context
}
