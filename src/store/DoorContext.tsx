import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import type { DoorInfo, TempRecord, AlarmRecord, ReviewRecord, AlarmReason, DoorStatus } from '@/types'
import { mockDoorInfo, mockTempRecords, mockAlarms, mockReviews } from '@/data/mock'
import { generateId } from '@/utils'

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
  const alarmCreatedForStatusRef = useRef<string>('')

  const createAlarm = useCallback((type: 'open' | 'ajar') => {
    const newAlarm: AlarmRecord = {
      id: generateId(),
      doorId: doorInfo.id,
      type,
      level: type === 'open' ? 'danger' : 'warning',
      occurTime: new Date().toISOString(),
      location: doorInfo.currentLocation,
      status: 'pending'
    }
    
    setAlarms(prev => [newAlarm, ...prev])
    setCurrentAlarm(newAlarm)
    setShowAlarmPopup(true)
    
    alarmCreatedForStatusRef.current = newAlarm.id
    
    console.log('[DoorContext] Alarm created:', newAlarm.id, type, 'from status change')
    return newAlarm
  }, [doorInfo.id, doorInfo.currentLocation])

  useEffect(() => {
    const prevStatus = prevStatusRef.current
    const currentStatus = doorInfo.status
    
    if (prevStatus === 'closed' && currentStatus !== 'closed') {
      const type = currentStatus === 'open' ? 'open' : 'ajar'
      createAlarm(type)
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

  const handleAlarmReason = useCallback((reason: AlarmReason) => {
    if (!currentAlarm) return
    
    const alarmId = currentAlarm.id
    
    setAlarms(prev => prev.map(alarm => 
      alarm.id === alarmId 
        ? { ...alarm, reason, status: 'processing' as const }
        : alarm
    ))
    
    setCurrentAlarm(prev => prev ? { ...prev, reason, status: 'processing' as const } : null)
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
      setAlarms(prev => prev.map(alarm =>
        alarm.id === alarmId
          ? { ...alarm, ...data, status: 'resolved' as const, handleTime: new Date().toISOString() }
          : alarm
      ))
      
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
      const newReview: ReviewRecord = {
        ...data,
        id: generateId(),
        reviewTime: new Date().toISOString()
      }
      setReviews(prev => [newReview, ...prev])
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
      getAlarmById
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
