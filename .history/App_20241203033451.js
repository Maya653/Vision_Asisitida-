import Voice from '@react-native-voice/voice'; // Instalar con npm install @react-native-voice/voice
import * as Location from 'expo-location';
import * as Speech from 'expo-speech';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableWithoutFeedback, View } from 'react-native';

const App = () => {
  const [isListening, setIsListening] = useState(false);
  const [location, setLocation] = useState(null);

  const speak = (message) => {
    console.log('Hablando:', message);
    Speech.speak(message, {
      language: 'es-ES',
      pitch: 1,
      rate: 1,
    });
  };

  const startListening = () => {
    Voice.start('es-ES');
    setIsListening(true);
    speak('Estoy escuchando, por favor, di tu comando.');
  };

  const stopListening = () => {
    Voice.stop();
    setIsListening(false);
  };

  const handleVoiceResults = (result) => {
    const command = result?.[0]?.toLowerCase() || '';
    console.log('Comando detectado:', command);

    if (command.includes('ubicación')) {
      fetchCurrentLocation();
    } else if (command.includes('ruta')) {
      searchRoutes();
    } else {
      speak('No entendí el comando. Intenta nuevamente.');
    }
  };

  const fetchCurrentLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      speak('No tengo permisos para acceder a tu ubicación.');
      return;
    }

    const location = await Location.getCurrentPositionAsync({});
    setLocation(location);
    speak(`Tu ubicación actual es latitud ${location.coords.latitude}, longitud ${location.coords.longitude}.`);
  };

  const searchRoutes = () => {
    speak('Buscando rutas cercanas...');
    // Simular búsqueda de rutas
    setTimeout(() => {
      speak('Encontré varias rutas disponibles cerca de tu ubicación.');
    }, 2000);
  };

  useEffect(() => {
    Voice.onSpeechResults = (e) => handleVoiceResults(e.value);
    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  return (
    <TouchableWithoutFeedback onPress={startListening}>
      <View style={styles.container}>
        <Text style={styles.instructions}>
          Toca la pantalla para activar el reconocimiento por voz.
        </Text>
        {isListening && <Text style={styles.status}>Escuchando...</Text>}
        {location && (
          <Text style={styles.location}>
            Latitud: {location.coords.latitude}, Longitud: {location.coords.longitude}
          </Text>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  instructions: {
    fontSize: 16,
    color: '#333',
    marginBottom: 20,
  },
  status: {
    fontSize: 18,
    color: 'green',
    fontWeight: 'bold',
  },
  location: {
    fontSize: 14,
    color: '#555',
    marginTop: 10,
  },
});

export default App;
