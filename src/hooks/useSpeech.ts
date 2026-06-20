import { useRef, useCallback, useEffect } from 'react'
import Taro from '@tarojs/taro'

let audioContext: any = null
let isSupported: boolean | null = null

export const useSpeech = () => {
  const speakingRef = useRef(false)

  useEffect(() => {
    return () => {
      speakingRef.current = false
    }
  }, [])

  const checkSupport = useCallback((): boolean => {
    if (isSupported !== null) return isSupported
    
    try {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        isSupported = true
        console.log('[Speech] Web Speech API supported')
        return true
      }
      
      if (process.env.TARO_ENV === 'weapp') {
        isSupported = false
        console.log('[Speech] WeChat mini program: TTS requires plugin')
        return false
      }
      
      isSupported = false
      console.log('[Speech] TTS not supported in current environment')
      return false
    } catch (err) {
      console.error('[Speech] Check support error:', err)
      isSupported = false
      return false
    }
  }, [])

  const speak = useCallback((text: string, options?: { rate?: number; pitch?: number }) => {
    const { rate = 1, pitch = 1 } = options || {}
    
    console.log('[Speech] Speaking:', text)
    
    if (!checkSupport()) {
      console.log('[Speech] TTS not supported, silent fallback')
      return false
    }
    
    try {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text)
        utterance.rate = rate
        utterance.pitch = pitch
        utterance.lang = 'zh-CN'
        
        utterance.onstart = () => {
          speakingRef.current = true
          console.log('[Speech] Speech started')
        }
        
        utterance.onend = () => {
          speakingRef.current = false
          console.log('[Speech] Speech ended')
        }
        
        utterance.onerror = (e) => {
          speakingRef.current = false
          console.error('[Speech] Speech error:', e)
        }
        
        window.speechSynthesis.speak(utterance)
        return true
      }
      
      return false
    } catch (err) {
      console.error('[Speech] Speak error:', err)
      return false
    }
  }, [checkSupport])

  const speakAlarm = useCallback((type: 'open' | 'ajar' = 'open') => {
    const texts = type === 'open'
      ? [
          '警告！车门异常开启！',
          '请立即停车检查！',
          '请选择开门原因！'
        ]
      : [
          '注意！车门疑似虚掩！',
          '请检查车门状态！',
          '请选择原因！'
        ]
    
    const fullText = texts.join('')
    
    const success = speak(fullText, { rate: 1.0 })
    
    if (!success) {
      try {
        Taro.vibrateLong({
          success: () => console.log('[Speech] Fallback: vibration')
        })
      } catch (err) {
        console.error('[Speech] Fallback vibration error:', err)
      }
    }
    
    return success
  }, [speak])

  const stop = useCallback(() => {
    try {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
      speakingRef.current = false
      console.log('[Speech] Speech stopped')
    } catch (err) {
      console.error('[Speech] Stop error:', err)
    }
  }, [])

  return {
    speak,
    speakAlarm,
    stop,
    isSpeaking: speakingRef.current,
    isSupported: checkSupport()
  }
}
