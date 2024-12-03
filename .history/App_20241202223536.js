import * as LocalAuthentication from 'expo-local-authentication';
import * as Speech from 'expo-speech';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';

// Función para registrar el evento de autenticación en MongoDB
const registerAuthenticationEvent = async (userId, huellaData) => {
  try {
    const response = await fetch('http://192.168.2.120:3000/api/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, huellaData }), // Se envía el ID de usuario y la huella en Base64
    });

    const data = await response.json();

    if (response.ok) {
      console.log('Evento registrado:', data.message);
    } else {
      console.error('Error al registrar evento:', data.message);
    }
  } catch (error) {
    console.error('Error de conexión:', error);
  }
};

// Función para registrar una nueva huella
const registerFingerprint = async (userId) => {
  speak('Coloca tu dedo en el sensor para registrar tu huella.');

  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Registrar nueva huella',
      fallbackLabel: 'Intentar de nuevo',
      disableDeviceFallback: true,
    });

    if (result.success) {
      speak('Huella capturada. Registrando en el sistema.');

      // Simulación de obtención de datos de la huella (reemplazar con datos reales)
      const huellaData = 'data:image/png;base64,.....';

      // Llamar al backend para registrar la huella
      const response = await fetch('http://192.168.2.120:3000/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, huellaData }),
      });

      const data = await response.json();

      if (response.ok) {
        speak('Huella registrada con éxito. Ahora puedes autenticarte.');
      } else {
        speak('Error al registrar la huella. Intenta de nuevo.');
      }
    } else {
      speak('No se pudo capturar la huella. Intenta de nuevo.');
    }
  } catch (error) {
    console.error('Error en registro de huella:', error);
    speak('Hubo un error al registrar la huella.');
  }
};

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [tapCount, setTapCount] = useState(0); // Para contar el número de toques
  const [userId] = useState(Math.floor(Math.random() * 10000)); // Genera un ID de usuario aleatorio para este ejemplo
  const [timeoutId, setTimeoutId] = useState(null); // Para almacenar el ID del temporizador
  const [lastTap, setLastTap] = useState(0); // Último toque registrado

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

  // Función para manejar los toques
  const handleTap = (e) => {
    const now = Date.now();
    const touchY = e.nativeEvent.pageY; // Coordenada Y del toque

    // Detectamos si el toque es en la parte superior o inferior de la pantalla
    const isTopArea = touchY < 200; // Área superior (puedes ajustar este valor según el tamaño de la pantalla)
    const isBottomArea = touchY > 500; // Área inferior (ajustar según la pantalla)

    if (tapCount === 0 || now - lastTap > 600) {
      setTapCount(1);
      clearTimeout(timeoutId);
    } else if (tapCount === 1 && now - lastTap < 600) {
      setTapCount(2);
      clearTimeout(timeoutId);
    }

    setLastTap(now);

    // Establecemos un temporizador para reiniciar el contador después de un intervalo largo
    const newTimeoutId = setTimeout(() => {
      setTapCount(0); // Reiniciar el contador si no se detectan más toques en 1 segundo
    }, 1000); // 1000ms = 1 segundo
    setTimeoutId(newTimeoutId);

    // Si el toque fue en la parte superior o inferior, procesamos la acción correspondiente
    if (tapCount === 2) {
      if (isTopArea) {
        authenticateUser(); // Autenticar usuario
      } else if (isBottomArea) {
        registerFingerprint(userId); // Registrar huella
      }
      setTapCount(0); // Restablecer el contador después del toque
    }
  };

  // Función para autenticar al usuario
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
          speak('Autenticación biométrica exitosa. Verificando huella...');

          // Simulación de obtención de datos de la huella
          const huellaData = 'data:image/png;base64,.....'; // Debes capturar la huella en Base64

          // Llamar al backend para verificar la huella
          const response = await fetch('http://192.168.2.120:3000/api/verify', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId, huellaData }),
          });

          const data = await response.json();

          if (response.ok && data.isValid) {
            setIsAuthenticated(true);
            speak('Inicio de sesión exitoso. Bienvenido.');
          } else {
            speak('La huella no coincide. Intenta de nuevo o registra una nueva huella tocando tres veces la pantalla.');
          }
        } else {
          speak('Autenticación biométrica fallida. Intenta de nuevo.');
        }
      } catch (error) {
        console.error('Error en autenticación biométrica:', error);
        speak('Hubo un error al intentar autenticar.');
      }
    } else {
      speak('No se encontró soporte biométrico en este dispositivo.');
    }
  };

  // Función para manejar el botón de emergencia
  const handleEmergency = () => {
    Alert.alert('Emergencia', 'Se ha activado la alerta de emergencia.');
    speak('Alerta de emergencia activada.');
  };

  // Ejecutar las instrucciones iniciales cuando se carga la app
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
            <TouchableOpacity style={styles.emergencyButton} onPress={handleEmergency}>
              <Text style={styles.emergencyText}>Alerta de emergencia</Text>
            </TouchableOpacity>
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
  emergencyButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#e53935',
    borderRadius: 5,
  },
  emergencyText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default App;
