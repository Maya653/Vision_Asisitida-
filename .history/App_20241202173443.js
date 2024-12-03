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
      console.log("Evento registrado:", data.message);
    } else {
      console.error("Error al registrar evento:", data.message);
    }
  } catch (error) {
    console.error("Error de conexión:", error);
  }
};

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [lastTap, setLastTap] = useState(0);
  const [userId] = useState(Math.floor(Math.random() * 10000)); // Genera un ID de usuario aleatorio para este ejemplo

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
    speak('Hola, soy tu app de visión asistida. Por favor toca dos veces la pantalla para colocar tu huella en el sensor y autenticarte.');
  };

  // Función para manejar el doble toque
  const handleDoubleTap = () => {
    const now = Date.now();
    if (lastTap && now - lastTap < 300 && !isAuthenticated) {
      console.log('Doble toque detectado.');
      authenticateUser(); // Llamada a la función de autenticación si se detecta doble toque
    } else {
      setLastTap(now);
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
          setIsAuthenticated(true);
          speak('Inicio de sesión exitoso. Bienvenido.');

          // Aquí deberías obtener la huella en formato Base64 (esto es un ejemplo con datos ficticios)
          const huellaData = 'data:image/png;base64,.....'; // Aquí debes capturar la huella y convertirla a Base64

          // Registra el evento de autenticación con la huella en Base64
          registerAuthenticationEvent(userId, huellaData); // Pasa el userId y la huellaData al backend
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
    <TouchableWithoutFeedback onPress={handleDoubleTap}>
      <View style={styles.container}>
        {!isAuthenticated ? (
          <View style={styles.card}>
            <Text style={styles.welcomeText}>¡Bienvenido!</Text>
            <Text style={styles.instructions}>
              Toca dos veces la pantalla para colocar tu huella en el sensor y autenticarte.
            </Text>
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.welcomeText}>Inicio de sesión exitoso</Text>
            <Text style={styles.instructions}>
              Accede a las funcionalidades de la aplicación.
            </Text>
            <TouchableOpacity style={styles.emergencyButton} onPress={handleEmergency}>
              <Text style={styles.emergencyText}>Emergencia</Text>
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
    backgroundColor: '#f0f0f0',
  },
  card: {
    width: '80%',
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  instructions: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    marginBottom: 20,
  },
  emergencyButton: {
    backgroundColor: '#ff4d4d',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginTop: 20,
  },
  emergencyText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
  },
});

export default App;