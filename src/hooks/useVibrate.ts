import Taro from '@tarojs/taro'

export const useVibrate = () => {
  const vibrateShort = () => {
    try {
      Taro.vibrateShort({
        type: 'heavy',
        success: () => console.log('[Vibrate] Short vibration triggered'),
        fail: (err) => console.error('[Vibrate] Short vibration failed:', err)
      })
    } catch (err) {
      console.error('[Vibrate] Short vibration error:', err)
    }
  }

  const vibrateLong = () => {
    try {
      Taro.vibrateLong({
        success: () => console.log('[Vibrate] Long vibration triggered'),
        fail: (err) => console.error('[Vibrate] Long vibration failed:', err)
      })
    } catch (err) {
      console.error('[Vibrate] Long vibration error:', err)
    }
  }

  const vibratePattern = (pattern: number[] = [200, 100, 200, 100, 200]) => {
    try {
      pattern.forEach((duration, index) => {
        setTimeout(() => {
          if (index % 2 === 0) {
            Taro.vibrateShort({ type: 'heavy' })
          }
        }, pattern.slice(0, index).reduce((a, b) => a + b, 0))
      })
      console.log('[Vibrate] Pattern vibration triggered:', pattern)
    } catch (err) {
      console.error('[Vibrate] Pattern vibration error:', err)
    }
  }

  return {
    vibrateShort,
    vibrateLong,
    vibratePattern
  }
}
