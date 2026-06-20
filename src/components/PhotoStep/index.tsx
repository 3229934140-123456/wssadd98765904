import React from 'react'
import { View, Text, Button, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import classnames from 'classnames'
import styles from './index.module.scss'

interface PhotoStepProps {
  step: number
  title: string
  hint: string
  photoUrl: string
  onPhotoChange: (url: string) => void
  completed?: boolean
  tip?: string
}

const PhotoStep: React.FC<PhotoStepProps> = ({
  step,
  title,
  hint,
  photoUrl,
  onPhotoChange,
  completed = false,
  tip
}) => {
  const handleChooseImage = async () => {
    try {
      const res = await Taro.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['camera', 'album']
      })
      
      if (res.tempFilePaths && res.tempFilePaths.length > 0) {
        onPhotoChange(res.tempFilePaths[0])
        console.log('[PhotoStep] Photo selected:', res.tempFilePaths[0])
      }
    } catch (err) {
      console.error('[PhotoStep] Choose image error:', err)
      Taro.showToast({
        title: '拍照失败',
        icon: 'none'
      })
    }
  }
  
  const handleRemovePhoto = (e: any) => {
    e.stopPropagation()
    onPhotoChange('')
    console.log('[PhotoStep] Photo removed')
  }
  
  return (
    <View className={styles.stepCard}>
      <View className={styles.stepHeader}>
        <View className={classnames(styles.stepNumber, completed && styles.completed)}>
          <Text>{completed ? '✓' : step}</Text>
        </View>
        <Text className={styles.stepTitle}>{title}</Text>
      </View>
      
      <Text className={styles.stepHint}>{hint}</Text>
      
      <View className={styles.photoArea}>
        {photoUrl ? (
          <View className={styles.photoPreview}>
            <Image
              className={styles.image}
              src={photoUrl}
              mode='aspectFill'
              onClick={handleChooseImage}
            />
            <View className={styles.removeBtn} onClick={handleRemovePhoto}>
              <Text>×</Text>
            </View>
          </View>
        ) : (
          <Button className={styles.photoBtn} onClick={handleChooseImage}>
            <Text className={styles.photoIcon}>📷</Text>
            <Text className={styles.photoText}>点击拍照</Text>
          </Button>
        )}
      </View>
      
      {tip && (
        <Text className={styles.photoTip}>💡 {tip}</Text>
      )}
    </View>
  )
}

export default PhotoStep
