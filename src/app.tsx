import React, { useEffect } from 'react';
import { useDidShow, useDidHide } from '@tarojs/taro';
import { DoorProvider } from './store/DoorContext';
import './app.scss';

function App(props) {
  useEffect(() => {
    console.log('[App] App initialized');
  }, []);

  useDidShow(() => {
    console.log('[App] App showed');
  });

  useDidHide(() => {
    console.log('[App] App hidden');
  });

  return (
    <DoorProvider>
      {props.children}
    </DoorProvider>
  );
}

export default App;
