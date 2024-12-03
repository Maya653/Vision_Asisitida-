import Voice from '@react-native-voice/voice';
import React, { useState } from 'react';
import { Button, PermissionsAndroid, Platform, Text, View } from 'react-native';

const VoiceTest = () => {
  const [result, setResult] = useState('');

  const startVoiceRecognition = async () => {
    if (Platform.OS === 'android') {
      const permission = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
      );

      if (permission !== PermissionsAndroid.RESULTS.GRANTED) {
        console.log('Permiso denegado');
        return;
      }
    }

    try {
      await Voice.start('es-MX'); // Cambia a tu idioma si es necesario
    } catch (error) {
      console.error('Error al iniciar el reconocimiento:', error);
    }
  };

  Voice.onSpeechResults = (e) => {
    setResult(e.value[0]);
  };

  return (
    <View>
      <Text>Resultado: {result}</Text>
      <Button title="Iniciar reconocimiento" onPress={startVoiceRecognition} />
    </View>
  );
};

export default VoiceTest;
