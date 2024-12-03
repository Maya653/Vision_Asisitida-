import * as LocalAuthentication from 'expo-local-authentication';
import * as Speech from 'expo-speech';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

// Función para registrar el evento de autenticación
const registerAuthenticationEvent = async (userId) => {
  try {
    const response = await fetch('http://192.168.212.133:3000/api/huellas', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, message: 'Huella registrada correctamente.' }),
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
          registerAuthenticationEvent(userId); // Registra el evento de autenticación
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
    backgroundColor: '#f3f4f6',
  },
  card: {
    width: '90%',
    padding: 20,
    backgroundColor: '#ffffff',
    borderRadius: 15,
    borderColor: '#e2e8f0',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 10,
  },
  instructions: {
    fontSize: 16,
    color: '#4b5563',
    textAlign: 'center',
    marginVertical: 15,
    lineHeight: 22,
  },
  emergencyButton: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 25,
    backgroundColor: '#ef4444',
    borderRadius: 10,
  },
  emergencyText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default App;
