import Voice from '@react-native-voice/voice';
import React, { useState } from 'react';
import { Alert, Text, TouchableWithoutFeedback, View } from 'react-native';

const VoiceCommandApp = () => {
  const [isListening, setIsListening] = useState(false);

  const handleDoubleTap = async () => {
    setIsListening(true);
    try {
      await Voice.start('es-ES'); // Idioma español
      console.log('Reconocimiento de voz iniciado');
    } catch (error) {
      console.error('Error al iniciar el reconocimiento de voz:', error);
    }
  };

  const onSpeechResults = (event) => {
    const recognizedText = event.value[0];
    console.log('Comando reconocido:', recognizedText);

    if (recognizedText.toLowerCase().includes('registrar huella')) {
      Alert.alert('Comando', 'Registrar huella detectado');
    } else if (recognizedText.toLowerCase().includes('iniciar sesión')) {
      Alert.alert('Comando', 'Iniciar sesión detectado');
    } else {
      Alert.alert('Comando', 'No se reconoce el comando');
    }
  };

  React.useEffect(() => {
    Voice.onSpeechResults = onSpeechResults;

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  return (
    <TouchableWithoutFeedback onPress={handleDoubleTap}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>{isListening ? 'Escuchando...' : 'Toca dos veces para hablar'}</Text>
      </View>
    </TouchableWithoutFeedback>
  );
};

export default VoiceCommandApp;
