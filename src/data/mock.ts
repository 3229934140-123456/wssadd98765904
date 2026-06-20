import type { DoorInfo, TempRecord, AlarmRecord, ReviewRecord } from '@/types'

export const mockDoorInfo: DoorInfo = {
  id: 'door-001',
  status: 'closed',
  lastOpenTime: '2026-06-20 23:45:30',
  lastCloseTime: '2026-06-20 23:46:15',
  vehicleNo: '京A·88888',
  currentLocation: '京沪高速 G2 济南段',
  isMoving: true
}

export const mockTempRecords: TempRecord[] = [
  { time: '00:00', temperature: -18.2 },
  { time: '01:00', temperature: -18.0 },
  { time: '02:00', temperature: -17.8 },
  { time: '03:00', temperature: -18.1 },
  { time: '04:00', temperature: -18.3 },
  { time: '05:00', temperature: -17.9 },
  { time: '06:00', temperature: -18.0 },
  { time: '07:00', temperature: -18.2 }
]

export const mockAlarms: AlarmRecord[] = [
  {
    id: 'alarm-001',
    doorId: 'door-001',
    type: 'open',
    level: 'danger',
    occurTime: '2026-06-20 23:45:30',
    location: '京沪高速 G2 济南段',
    status: 'resolved',
    reason: 'loading',
    photos: {
      door: 'https://picsum.photos/id/3/600/800',
      seal: 'https://picsum.photos/id/6/600/800',
      environment: 'https://picsum.photos/id/8/600/800'
    },
    isRelocked: true,
    handler: '张师傅',
    handleTime: '2026-06-20 23:50:00',
    remark: '临时装卸货物，已重新锁闭'
  },
  {
    id: 'alarm-002',
    doorId: 'door-001',
    type: 'ajar',
    level: 'warning',
    occurTime: '2026-06-20 15:30:00',
    location: '京沪高速 G2 泰安段',
    status: 'pending'
  },
  {
    id: 'alarm-003',
    doorId: 'door-001',
    type: 'open',
    level: 'danger',
    occurTime: '2026-06-20 10:15:00',
    location: '北京市大兴区物流园',
    status: 'resolved',
    reason: 'misoperation',
    photos: {
      door: 'https://picsum.photos/id/9/600/800',
      seal: 'https://picsum.photos/id/1/600/800',
      environment: 'https://picsum.photos/id/2/600/800'
    },
    isRelocked: true,
    handler: '张师傅',
    handleTime: '2026-06-20 10:18:00',
    remark: '误触门磁开关，已重新检查锁闭'
  }
]

export const mockReviews: ReviewRecord[] = [
  {
    id: 'review-001',
    doorId: 'door-001',
    vehicleNo: '京A·88888',
    reviewer: '李站长',
    reviewTime: '2026-06-20 08:30:00',
    doorStatus: 'closed',
    sealStatus: 'intact',
    compareResult: 'consistent',
    photos: {
      door: 'https://picsum.photos/id/3/600/800',
      seal: 'https://picsum.photos/id/6/600/800'
    },
    lastAlarmPhotos: {
      door: 'https://picsum.photos/id/9/600/800',
      seal: 'https://picsum.photos/id/1/600/800'
    },
    remark: '门磁状态正常，封签完好，与上次处置记录一致，准许卸货'
  },
  {
    id: 'review-002',
    doorId: 'door-001',
    vehicleNo: '京A·88888',
    reviewer: '王调度',
    reviewTime: '2026-06-19 19:45:00',
    doorStatus: 'closed',
    sealStatus: 'intact',
    compareResult: 'consistent',
    photos: {
      door: 'https://picsum.photos/id/9/600/800',
      seal: 'https://picsum.photos/id/1/600/800'
    },
    remark: '封签完好，装货完成'
  }
]

export const reasonOptions = [
  { value: 'loading', label: '临时装卸', color: '#165dff' },
  { value: 'misoperation', label: '误触', color: '#ff7d00' },
  { value: 'abnormal', label: '异常停车', color: '#f53f3f' }
]
