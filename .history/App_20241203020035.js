import * as LocalAuthentication from 'expo-local-authentication';
import * as Location from 'expo-location'; // Para obtener la ubicación
import * as Speech from 'expo-speech';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableWithoutFeedback, View } from 'react-native';
import { registerFingerprint } from './services/fingerprintService'; // Simulación de registro de huella

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [tapCount, setTapCount] = useState(0); // Contador de toques
  const [userId] = useState(Math.floor(Math.random() * 10000)); // ID de usuario aleatorio
  const [lastTap, setLastTap] = useState(0); // Último toque registrado
  const [lastVolumePress, setLastVolumePress] = useState(0); // Para detectar doble toque de volumen
  const [location, setLocation] = useState(null); // Ubicación actual

  // Función para hablar
  const speak = (message) => {
    console.log('Hablando:', message);
    Speech.speak(message, {
      language: 'es-ES',
      pitch: 1,
      rate: 1,
    });
  };

  // Función para obtener la ubicación del usuario
  const getLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation.coords);
      speak(`Tu ubicación actual es Latitud ${currentLocation.coords.latitude}, Longitud ${currentLocation.coords.longitude}`);
    } else {
      speak('No se pudo obtener tu ubicación.');
    }
  };

  // Función de emergencia
  const sendEmergencyAlert = () => {
    if (location) {
      const emergencyMessage = `Emergencia. Mi ubicación es Latitud: ${location.latitude}, Longitud: ${location.longitude}`;
      Alert.alert('Mensaje de emergencia enviado', emergencyMessage); // Simulación de envío
      speak('Mensaje de emergencia enviado con tu ubicación.');
    } else {
      speak('No se pudo obtener tu ubicación para enviar el mensaje de emergencia.');
    }
  };

  // Instrucciones iniciales al usuario
  const guideUser = () => {
    speak(
      'Hola, soy tu app de visión asistida. Toca dos veces la parte superior para autenticarte o la parte inferior para registrar una nueva huella.'
    );
  };

  // Manejo de toques en pantalla
  const handleTap = (e) => {
    if (isAuthenticated) {
      const now = Date.now();
      const touchY = e.nativeEvent.pageY; // Coordenada Y del toque
      const isTopArea = touchY < 200; // Área superior (ajustar según pantalla)
      const isBottomArea = touchY > 500; // Área inferior (ajustar según pantalla)

      if (tapCount === 0 || now - lastTap > 600) {
        setTapCount(1);
      } else if (tapCount === 1 && now - lastTap < 600) {
        setTapCount(2);
        // Procesar acción basada en la ubicación del toque
        if (isTopArea) {
          getLocation(); // Acceder al GPS
        } else if (isBottomArea) {
          speak('Ejemplo de búsqueda de rutas: Ruta A, Ruta B, Ruta C'); // Ejemplo de rutas
        }
        setTapCount(0); // Reiniciar contador
      }
      setLastTap(now);
    } else {
      speak('Debes autenticarte primero.');
    }
  };

  // Detectar doble toque de volumen (emergencia)
  useEffect(() => {
    const handleVolumePress = () => {
      const now = Date.now();
      if (now - lastVolumePress < 600) {
        sendEmergencyAlert();
      }
      setLastVolumePress(now);
    };

    // Se puede implementar un listener para eventos de hardware de volumen si es necesario
    // Asegúrate de usar una librería adecuada para escuchar eventos de volumen si es necesario
    // Por ejemplo, en React Native puede usarse `react-native-volume-button` para esto.

    return () => {
      // Limpiar el listener si es necesario
    };
  }, [lastVolumePress]);

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
              Toca la parte superior para acceder al GPS, la parte inferior para buscar rutas, o presiona dos veces el botón de volumen para emergencia.
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
