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
  const [lastVolumeDownTime, setLastVolumeDownTime] = useState(0); // Control del doble toque de volumen
  const [volumeDownTapCount, setVolumeDownTapCount] = useState(0); // Contador de toques del volumen hacia abajo

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

  // Instrucciones después de inicio de sesión
  const guidePostLogin = () => {
    speak(
      'Inicio de sesión exitoso. Toca dos veces la parte superior para activar el GPS, o dos veces la parte inferior para buscar rutas.'
    );
  };

  // Manejo de toques en pantalla
  const handleTap = (e) => {
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
      if (isTopArea && !isAuthenticated) {
        authenticateUser(); // Solo si no está autenticado
      } else if (isBottomArea && !isAuthenticated) {
        handleFingerprintRegistration(); // Solo si no está autenticado
      } else if (isTopArea && isAuthenticated) {
        speak('Activando GPS...');
        // Aquí puedes agregar la lógica para activar el GPS
      } else if (isBottomArea && isAuthenticated) {
        speak('Buscando rutas...');
        // Aquí puedes agregar la lógica para buscar rutas
      }
      setTapCount(0); // Reiniciar contador después de la acción
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
          guidePostLogin(); // Guía post inicio de sesión
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
              Toca dos veces la parte superior para usar el GPS, o dos veces la parte inferior para buscar rutas.
            </Text>
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
