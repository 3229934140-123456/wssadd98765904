export type DoorStatus = 'closed' | 'open' | 'ajar'

export interface DoorInfo {
  id: string
  status: DoorStatus
  lastOpenTime: string
  lastCloseTime: string
  vehicleNo: string
  currentLocation: string
  isMoving: boolean
}

export interface TempRecord {
  time: string
  temperature: number
}

export interface TimelineEvent {
  type: 'status_change' | 'reason_select' | 'photo_taken' | 'lock_confirm' | 'submit_handle' | 'review_compare' | 'handover_note'
  title: string
  description?: string
  operator?: string
  time: string
}

export interface HandoverNote {
  id: string
  type: 'driver' | 'reviewer'
  content: string
  operator: string
  time: string
}

export interface AlarmRecord {
  id: string
  doorId: string
  type: 'open' | 'ajar' | 'temp'
  level: 'warning' | 'danger'
  occurTime: string
  location: string
  status: 'pending' | 'processing' | 'resolved'
  reason?: 'loading' | 'misoperation' | 'abnormal'
  photos?: {
    door: string
    seal: string
    environment: string
  }
  isRelocked?: boolean
  handler?: string
  handleTime?: string
  remark?: string
  timeline?: TimelineEvent[]
  handoverNotes?: HandoverNote[]
}

export interface SealInfo {
  id: string
  status: 'intact' | 'broken'
  sealNo: string
  photoUrl: string
}

export interface ReviewRecord {
  id: string
  doorId: string
  vehicleNo: string
  reviewer: string
  reviewTime: string
  doorStatus: DoorStatus
  sealStatus: 'intact' | 'broken'
  compareResult: 'consistent' | 'inconsistent'
  photos: {
    door: string
    seal: string
  }
  lastAlarmPhotos?: {
    seal: string
    door: string
  }
  lastDoorStatus?: DoorStatus
  lastAlarmId?: string
  remark: string
}

export type AlarmReason = 'loading' | 'misoperation' | 'abnormal'
