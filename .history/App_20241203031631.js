import { useKeepAwake } from 'expo-keep-awake'; // Mantener la pantalla encendida
import * as LocalAuthentication from 'expo-local-authentication';
import * as Speech from 'expo-speech';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableWithoutFeedback, View } from 'react-native';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [tapCount, setTapCount] = useState(0); // Contador de toques
  const [userId] = useState(Math.floor(Math.random() * 10000)); // ID de usuario aleatorio
  const [timeoutId, setTimeoutId] = useState(null); // ID del temporizador
  const [lastTap, setLastTap] = useState(0); // Último toque registrado

  // Mantener la pantalla activa
  useKeepAwake();

  // Función centralizada para hablar
  const speak = (message) => {
    console.log('Hablando:', message);
    Speech.speak(message, {
      language: 'es-ES',
      pitch: 1,
      rate: 1,
    });
  };

  // Mensajes predefinidos del asistente
  const messages = {
    welcome:
      'Hola, soy tu app de visión asistida. Toca dos veces la parte superior para autenticarte o la parte inferior para registrar una nueva huella.',
    postLogin:
      'Inicio de sesión exitoso. Toca dos veces la parte superior para activar el GPS, o dos veces la parte inferior para buscar rutas.',
    gps: 'Activando GPS...',
    searchRoutes: 'Buscando rutas...',
    emergency: '¡Emergencia activada! Enviando ubicación y alertas de emergencia.',
    authPrompt: 'Coloca tu dedo en el sensor para autenticarte.',
    authSuccess: 'Autenticación biométrica exitosa. Bienvenido.',
    authFailure: 'Autenticación fallida. Intenta de nuevo.',
    registerPrompt: 'Coloca tu dedo en el sensor para registrar tu huella.',
    registerSuccess: 'Huella registrada con éxito.',
    registerFailure: 'No se pudo capturar la huella. Intenta de nuevo.',
  };

  // Instrucciones iniciales
  useEffect(() => {
    speak(messages.welcome);
  }, []);

  // Manejo de toques en pantalla
  const handleTap = (e) => {
    const now = Date.now();
    const touchY = e.nativeEvent.pageY;
    const isTopArea = touchY < 500; // Área superior
    const isBottomArea = touchY > 500; // Área inferior

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
      if (!isAuthenticated) {
        if (isTopArea) authenticateUser();
        if (isBottomArea) registerFingerprint();
      } else {
        if (isTopArea) speak(messages.gps);
        if (isBottomArea) speak(messages.searchRoutes);
      }
      setTapCount(0);
    }
  };

  // Autenticar usuario
  const authenticateUser = async () => {
    speak(messages.authPrompt);

    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const supportedAuthTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();

    if (hasHardware && supportedAuthTypes.length > 0) {
      try {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Autenticación biométrica',
          fallbackLabel: 'Intentar de nuevo',
          disableDeviceFallback: true,
        });

        if (result.success) {
          speak(messages.authSuccess);
          setIsAuthenticated(true);
          speak(messages.postLogin);
        } else {
          speak(messages.authFailure);
        }
      } catch (error) {
        console.error('Error en autenticación biométrica:', error);
        speak('Hubo un error al intentar autenticar.');
      }
    } else {
      speak('No se encontró soporte biométrico en este dispositivo.');
    }
  };

  // Registrar huella
  const registerFingerprint = async () => {
    speak(messages.registerPrompt);

    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Registrar nueva huella',
        fallbackLabel: 'Intentar de nuevo',
        disableDeviceFallback: true,
      });

      if (result.success) {
        speak(messages.registerSuccess);

        // Aquí puedes agregar lógica para guardar la huella en el backend
      } else {
        speak(messages.registerFailure);
      }
    } catch (error) {
      console.error('Error en registro de huella:', error);
      speak('Hubo un error al registrar la huella.');
    }
  };

  return (
    <TouchableWithoutFeedback onPress={handleTap}>
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.welcomeText}>
            {!isAuthenticated
              ? '¡Bienvenido! Toca dos veces la parte superior para autenticarte o la parte inferior para registrar una nueva huella.'
              : 'Inicio de sesión exitoso. Toca dos veces la parte superior para usar el GPS, o la parte inferior para buscar rutas.'}
          </Text>
        </View>
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
  card: {
    padding: 20,
    margin: 20,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
});

export default App;
