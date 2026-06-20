import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import type { DoorInfo, TempRecord, AlarmRecord, ReviewRecord, AlarmReason } from '@/types'
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
  updateDoorStatus: (status: DoorInfo['status']) => void
  submitAlarmHandle: (alarmId: string, data: Partial<AlarmRecord>) => boolean
  submitReview: (data: Omit<ReviewRecord, 'id' | 'reviewTime'>) => boolean
  getPendingAlarms: () => AlarmRecord[]
  getLastResolvedAlarm: () => AlarmRecord | undefined
}

const DoorContext = createContext<DoorContextType | null>(null)

export const DoorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [doorInfo, setDoorInfo] = useState<DoorInfo>(mockDoorInfo)
  const [tempRecords] = useState<TempRecord[]>(mockTempRecords)
  const [alarms, setAlarms] = useState<AlarmRecord[]>(mockAlarms)
  const [reviews, setReviews] = useState<ReviewRecord[]>(mockReviews)
  const [currentAlarm, setCurrentAlarm] = useState<AlarmRecord | null>(null)
  const [showAlarmPopup, setShowAlarmPopup] = useState(false)
  const prevStatusRef = useRef<DoorInfo['status']>(mockDoorInfo.status)
  const alarmTriggeredRef = useRef<Set<string>>(new Set())

  const triggerAlarm = useCallback((type: 'open' | 'ajar') => {
    const alarmKey = `${type}-${Date.now()}`
    
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
    alarmTriggeredRef.current.add(newAlarm.id)
    
    if (type === 'open') {
      setDoorInfo(prev => ({ ...prev, status: 'open', lastOpenTime: new Date().toISOString() }))
    } else {
      setDoorInfo(prev => ({ ...prev, status: 'ajar' }))
    }
    
    console.log('[DoorContext] Alarm triggered:', newAlarm.id, type)
    return newAlarm
  }, [doorInfo.id, doorInfo.currentLocation])

  const handleAlarmReason = useCallback((reason: AlarmReason) => {
    if (!currentAlarm) return
    
    setAlarms(prev => prev.map(alarm => 
      alarm.id === currentAlarm.id 
        ? { ...alarm, reason, status: 'processing' as const }
        : alarm
    ))
    
    setCurrentAlarm(prev => prev ? { ...prev, reason, status: 'processing' as const } : null)
    setShowAlarmPopup(false)
    
    console.log('[DoorContext] Alarm reason selected:', currentAlarm.id, reason)
  }, [currentAlarm])

  const updateDoorStatus = useCallback((status: DoorInfo['status']) => {
    const prevStatus = prevStatusRef.current
    prevStatusRef.current = status
    
    setDoorInfo(prev => ({
      ...prev,
      status,
      lastCloseTime: status === 'closed' ? new Date().toISOString() : prev.lastCloseTime,
      lastOpenTime: status === 'open' ? new Date().toISOString() : prev.lastOpenTime
    }))
    
    console.log('[DoorContext] Door status updated:', prevStatus, '->', status)
  }, [])

  useEffect(() => {
    const prevStatus = prevStatusRef.current
    
    if (doorInfo.isMoving && prevStatus === 'closed' && doorInfo.status !== 'closed') {
      const type = doorInfo.status === 'open' ? 'open' : 'ajar'
      console.log('[DoorContext] Auto trigger alarm: moving + door status changed to', type)
      
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
      alarmTriggeredRef.current.add(newAlarm.id)
      
      console.log('[DoorContext] Auto alarm created:', newAlarm.id)
    }
    
    prevStatusRef.current = doorInfo.status
  }, [doorInfo.status, doorInfo.isMoving, doorInfo.id, doorInfo.currentLocation])

  const submitAlarmHandle = useCallback((alarmId: string, data: Partial<AlarmRecord>): boolean => {
    try {
      setAlarms(prev => prev.map(alarm =>
        alarm.id === alarmId
          ? { ...alarm, ...data, status: 'resolved' as const, handleTime: new Date().toISOString() }
          : alarm
      ))
      
      if (data.isRelocked) {
        setDoorInfo(prev => ({ ...prev, status: 'closed', lastCloseTime: new Date().toISOString() }))
      }
      
      if (currentAlarm?.id === alarmId) {
        setCurrentAlarm(null)
      }
      
      console.log('[DoorContext] Alarm handled:', alarmId, data)
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
      console.log('[DoorContext] Review submitted:', newReview)
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
      getLastResolvedAlarm
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
