import * as Location from 'expo-location';
import * as SMS from 'expo-sms';
import * as Speech from 'expo-speech';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableWithoutFeedback, View } from 'react-native';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [tapCount, setTapCount] = useState(0);
  const [userId] = useState(Math.floor(Math.random() * 10000));
  const [timeoutId, setTimeoutId] = useState(null);
  const [lastTap, setLastTap] = useState(0);
  const [lastVolumePressTime, setLastVolumePressTime] = useState(0);
  const [volumePressCount, setVolumePressCount] = useState(0);
  const [location, setLocation] = useState(null);

  const speak = (message) => {
    Speech.speak(message, { language: 'es-ES' });
  };

  const guideUser = () => {
    speak('Hola, soy tu app de visión asistida. Toca dos veces la parte superior para autenticarte o la parte inferior para registrar una nueva huella.');
  };

  const getLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      speak('Permiso para acceder a la ubicación denegado');
      return;
    }

    const location = await Location.getCurrentPositionAsync({});
    setLocation(location);
    speak(`Tu ubicación es: Latitud ${location.coords.latitude}, Longitud ${location.coords.longitude}`);
  };

  const handleVolumeButtonPress = () => {
    const now = Date.now();
    if (now - lastVolumePressTime < 600) {
      setVolumePressCount(volumePressCount + 1);
    } else {
      setVolumePressCount(1);
    }
    setLastVolumePressTime(now);

    if (volumePressCount === 2) {
      sendEmergencySMS();
    }
  };

  const sendEmergencySMS = async () => {
    if (!location) {
      speak('No se pudo obtener la ubicación.');
      return;
    }

    const { result } = await SMS.sendSMSAsync(
      ['+1234567890'],
      `¡Emergencia! Estoy en la ubicación: ${location.coords.latitude}, ${location.coords.longitude}`
    );

    if (result === 'sent') {
      speak('Mensaje de emergencia enviado');
    } else {
      speak('Hubo un error al enviar el mensaje de emergencia');
    }
  };

  const handleTap = (e) => {
    if (isAuthenticated) return;
    const now = Date.now();
    const touchY = e.nativeEvent.pageY;
    const isTopArea = touchY < 200;
    const isBottomArea = touchY > 500;

    if (tapCount === 0 || now - lastTap > 600) {
      setTapCount(1);
      clearTimeout(timeoutId);
    } else if (tapCount === 1 && now - lastTap < 600) {
      setTapCount(2);
      clearTimeout(timeoutId);
    }
    setLastTap(now);

    const newTimeoutId = setTimeout(() => {
      setTapCount(0);
    }, 1000);
    setTimeoutId(newTimeoutId);

    if (tapCount === 2) {
      if (isTopArea) {
        authenticateUser();
      } else if (isBottomArea) {
        handleFingerprintRegistration();
        getLocation(); // Obtener la ubicación después de la autenticación
      }
      setTapCount(0);
    }
  };

  const authenticateUser = async () => {
    speak('Coloca tu dedo en el sensor para autenticarte.');
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    if (hasHardware) {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Autenticación biométrica',
      });

      if (result.success) {
        speak('Autenticación exitosa. Bienvenido.');
        setIsAuthenticated(true);
        speak('Las funcionalidades son las siguientes: 1. Acceder a GPS 2. Buscar rutas 3. Emergencia');
      } else {
        speak('Autenticación fallida. Intenta de nuevo.');
      }
    }
  };

  useEffect(() => {
    guideUser();
  }, []);

  return (
    <TouchableWithoutFeedback onPress={handleTap}>
      <View style={styles.container}>
        {!isAuthenticated ? (
          <View style={styles.authArea}>
            <Text>Autenticación requerida.</Text>
          </View>
        ) : (
          <Text>Bienvenido a la app, toca para acceder a las funcionalidades.</Text>
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
    backgroundColor: 'white',
  },
  authArea: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default App;
