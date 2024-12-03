import { useKeepAwake } from 'expo-keep-awake'; // Mantener la pantalla encendida
import * as LocalAuthentication from 'expo-local-authentication';
import * as Speech from 'expo-speech';
import * as SpeechToText from 'expo-speech-to-text'; // Supuesto módulo para transcripción de voz
import React, { useEffect, useState } from 'react';
import { Button, StyleSheet, Text, TouchableWithoutFeedback, View } from 'react-native';
import { registerFingerprint } from './services/fingerprintService';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [tapCount, setTapCount] = useState(0); // Contador de toques
  const [userId] = useState(Math.floor(Math.random() * 10000)); // ID de usuario aleatorio
  const [timeoutId, setTimeoutId] = useState(null); // ID del temporizador
  const [lastTap, setLastTap] = useState(0); // Último toque registrado
  const [lastVolumeDownTime, setLastVolumeDownTime] = useState(0); // Control del doble toque de volumen
  const [volumeDownTapCount, setVolumeDownTapCount] = useState(0); // Contador de toques del volumen hacia abajo
  const [isListening, setIsListening] = useState(false); // Estado de si el asistente está escuchando

  // Mantener la pantalla activa
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

  // Instrucciones iniciales al usuario
  const guideUser = () => {
    speak(
      'Hola, soy tu app de visión asistida. Toca dos veces la parte superior para autenticarte o la parte inferior para registrar una nueva huella.'
    );
  };

  // Manejo de toques en pantalla
  const handleTap = (e) => {
    if (isAuthenticated) return; // Deshabilitar toques si ya está autenticado

    const now = Date.now();
    const touchY = e.nativeEvent.pageY; // Coordenada Y del toque
    const isTopArea = touchY < 500; // Área superior (ajustar según pantalla)
    const isBottomArea = touchY > 500; // Área inferior (ajustar según pantalla)

    // Lógica para contar toques
    if (tapCount === 0 || now - lastTap > 600) {
      setTapCount(1);
      clearTimeout(timeoutId);
    } else if (tapCount === 1 && now - lastTap < 600) {
      setTapCount(2);
      clearTimeout(timeoutId);
    }
    setLastTap(now);

    const newTimeoutId = setTimeout(() => {
      setTapCount(0); // Reiniciar el contador después de un intervalo largo
    }, 1000);
    setTimeoutId(newTimeoutId);

    // Procesar acción basada en la ubicación del toque
    if (tapCount === 2) {
      if (isTopArea) {
        authenticateUser();
      } else if (isBottomArea) {
        handleFingerprintRegistration();
      }
      setTapCount(0); // Reiniciar contador
    }
  };

  // Función para manejar los toques del botón de volumen
  const handleVolumeDownTap = () => {
    const now = Date.now();
    if (now - lastVolumeDownTime < 600) {
      setVolumeDownTapCount(volumeDownTapCount + 1);
    } else {
      setVolumeDownTapCount(1); // Reseteamos el contador si pasa más tiempo
    }
    setLastVolumeDownTime(now);

    if (volumeDownTapCount >= 2) {
      triggerEmergency();
      setVolumeDownTapCount(0); // Reiniciar contador después de la emergencia
    }
  };

  // Activar función de emergencia
  const triggerEmergency = () => {
    speak('¡Emergencia activada! Enviando ubicación y alertas de emergencia.');
    // Aquí puedes agregar la lógica para enviar la ubicación y la notificación de emergencia
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

  // Registrar nueva huella
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

        // Simulación de huella (reemplazar con datos reales si es necesario)
        const huellaData = 'data:image/png;base64,.....';

        // Registrar huella en el backend
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

  // Buscar rutas
  const searchRoutes = () => {
    speak('Buscando rutas cercanas...');
    // Aquí puedes agregar la lógica para buscar rutas
  };

  // Usar GPS
  const useGPS = () => {
    speak('Activando GPS...');

    // Iniciar escucha de comandos de voz para el GPS
    setIsListening(true);
    startVoiceRecognition();  // Activamos la función de reconocimiento de voz
  };

  // Función para iniciar el reconocimiento de voz
  const startVoiceRecognition = () => {
    // Aquí deberías utilizar alguna librería de reconocimiento de voz como Google Cloud Speech o Expo Speech-to-Text.
    // Por ejemplo, SpeechToText.startListening() para iniciar la escucha
    SpeechToText.startListening({
      onResult: handleVoiceCommand,
    });
  };

  // Manejar comando de voz
  const handleVoiceCommand = (command) => {
    if (command.includes('activar GPS')) {
      speak('GPS activado');
      // Lógica para activar GPS aquí
    } else if (command.includes('detener GPS')) {
      speak('GPS detenido');
      // Lógica para detener GPS aquí
    } else {
      speak('No entendí el comando, por favor repite');
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
              Toca la parte superior para usar el GPS.
            </Text>
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
  },
  card: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    elevation: 5,
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 18,
    marginBottom: 10,
  },
  instructions: {
    fontSize: 16,
    textAlign: 'center',
  },
});

export default App;
