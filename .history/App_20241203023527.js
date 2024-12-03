import { useKeepAwake } from 'expo-keep-awake';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Speech from 'expo-speech';
import React, { useEffect, useState } from 'react';
import { Button, StyleSheet, Text, TouchableWithoutFeedback, View } from 'react-native';
import { registerFingerprint } from './services/fingerprintService';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [tapCount, setTapCount] = useState(0);
  const [userId] = useState(Math.floor(Math.random() * 10000));
  const [timeoutId, setTimeoutId] = useState(null);
  const [lastTap, setLastTap] = useState(0);
  const [lastVolumeDownTime, setLastVolumeDownTime] = useState(0);
  const [volumeDownTapCount, setVolumeDownTapCount] = useState(0);

  useKeepAwake();

  // Función para hablar
  const speak = (message) => {
    console.log('Hablando:', message);
    Speech.speak(message, {
      language: 'es-ES',
      pitch: 1,
      rate: 1,
    });
  };

  // Guía inicial
  const guideUser = () => {
    speak('Hola, soy tu app de visión asistida. Toca dos veces la parte superior para autenticarte o la parte inferior para registrar una nueva huella. También, si necesitas ayuda, toca dos veces el botón de volumen hacia abajo.');
  };

  // Manejo de toques en pantalla
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
        activateVoiceAssistant(); // Activar el asistente de voz
      } else if (isBottomArea) {
        handleFingerprintRegistration();
      }
      setTapCount(0);
    }
  };

  // Función para activar el asistente de voz
  const activateVoiceAssistant = () => {
    speak('Por favor, di a qué lugar quieres ir o dónde te encuentras.');

    // Aquí puedes agregar otras formas de obtener entrada de voz si lo deseas, por ejemplo, un input manual o una alternativa.
    // El código de reconocimiento de voz ha sido eliminado
  };

  // Buscar rutas
  const searchRoutes = (destination) => {
    speak(`Buscando rutas hacia ${destination}...`);
    // Aquí puedes agregar la lógica para buscar rutas o utilizar el GPS
    useGPS(destination); // Usar GPS con el destino proporcionado
  };

  // Usar GPS
  const useGPS = (destination) => {
    speak(`Activando GPS hacia ${destination}...`);
    // Aquí puedes agregar la lógica para activar el GPS con el destino proporcionado
  };

  // Autenticar usuario
  const authenticateUser = async () => {
    speak('Coloca tu dedo en el sensor para autenticarte.');

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
          speak('Autenticación biométrica exitosa. Bienvenido.');
          setIsAuthenticated(true);
        } else {
          speak('Autenticación fallida. Intenta de nuevo.');
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
  const handleFingerprintRegistration = async () => {
    speak('Coloca tu dedo en el sensor para registrar tu huella.');

    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Registrar nueva huella',
        fallbackLabel: 'Intentar de nuevo',
        disableDeviceFallback: true,
      });

      if (result.success) {
        speak('Huella capturada. Registrando en el sistema.');

        const huellaData = 'data:image/png;base64,.....';
        await registerFingerprint(userId, huellaData);
        speak('Huella registrada con éxito.');
      } else {
        speak('No se pudo capturar la huella. Intenta de nuevo.');
      }
    } catch (error) {
      console.error('Error en registro de huella:', error);
      speak('Hubo un error al registrar la huella.');
    }
  };

  useEffect(() => {
    guideUser();
  }, []);

  return (
    <TouchableWithoutFeedback onPress={handleTap}>
      <View style={styles.container}>
        {!isAuthenticated ? (
          <View style={styles.card}>
            <Text style={styles.welcomeText}>¡Bienvenido!</Text>
            <Text style={styles.instructions}>
              Toca dos veces la parte superior para autenticarte o la parte inferior para registrar una nueva huella.
            </Text>
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.welcomeText}>Inicio de sesión exitoso</Text>
            <Text style={styles.instructions}>
              Accede a las funcionalidades de la aplicación.
            </Text>
            <Text style={styles.instructions}>
              Toca la parte superior para usar el GPS o la parte inferior para buscar rutas.
            </Text>
            <Button title="Buscar rutas" onPress={searchRoutes} />
            <Button title="Usar GPS" onPress={useGPS} />
          </View>
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  instructions: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
});

export default App;
