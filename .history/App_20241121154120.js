import * as Audio from 'expo-av'; // Importamos expo-av para los permisos de audio
import * as LocalAuthentication from 'expo-local-authentication';
import * as Speech from 'expo-speech';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [authMessage, setAuthMessage] = useState("Autenticando...");

  // Solicitar permisos de micrófono
  const requestPermissions = async () => {
    const { status } = await Audio.requestPermissionsAsync();
    if (status !== 'granted') {
      speak('Permiso para acceder al micrófono denegado. La aplicación no funcionará correctamente.');
    }
  };

  useEffect(() => {
    requestPermissions(); // Solicitar permisos cuando se monta el componente
    authenticateUser(); // Iniciar la autenticación automáticamente
  }, []); // Solo ejecuta una vez al inicio

  // Función para hacer que la app hable
  const speak = (message) => {
    Speech.speak(message, {
      language: 'es-MX',
      pitch: 1,
      rate: 1,
    });
  };

  // Función de autenticación
  const authenticateUser = async () => {
    setAuthMessage("Por favor, autentíquese usando su huella dactilar.");
    speak("Bienvenido. Por favor, autentíquese usando su huella dactilar.");

    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const supportedAuthTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();

    if (hasHardware && supportedAuthTypes.length > 0) {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Autenticación requerida',
        fallbackLabel: 'Intentar de nuevo',
      });

      if (result.success) {
        setIsAuthenticated(true);
        setAuthMessage("Autenticación exitosa. Bienvenido a la aplicación.");
        speak("Autenticación exitosa. Bienvenido a la aplicación.");
        showOptions(); // Una vez autenticado, muestra las opciones
      } else {
        setFailedAttempts((prev) => prev + 1);
        setAuthMessage("Autenticación fallida. Inténtalo nuevamente.");
        speak("Autenticación fallida. Inténtalo nuevamente.");

        if (failedAttempts >= 2) {
          speak("Se ha alcanzado el límite de intentos fallidos. Por favor, intente nuevamente más tarde.");
          setFailedAttempts(0);
        }
      }
    } else {
      setAuthMessage("No se encontró soporte biométrico. No puede acceder.");
      speak("No se encontró soporte biométrico en su dispositivo. No puede acceder.");
    }
  };

  // Función para mostrar las opciones de la aplicación
  const showOptions = () => {
    speak("Las funciones disponibles en la aplicación son:");
    speak("Opción 1: Guia GPS.");
    speak("Opción 2: Rutas accesibles para el transporte público.");
    speak("Opción 3: Modo de emergencia.");
    speak("Opción 4: Personalización de la aplicación.");
    speak("Por favor, diga el número de la opción que desea seleccionar.");
  };

  // Función para manejar la selección de opciones (mediante comandos de voz)
  const onOptionSelected = (selectedOption) => {
    switch (selectedOption) {
      case '1':
        speak("Has seleccionado la opción 1: Guía GPS.");
        break;
      case '2':
        speak("Has seleccionado la opción 2: Rutas accesibles.");
        break;
      case '3':
        speak("Has seleccionado la opción 3: Modo de emergencia.");
        break;
      case '4':
        speak("Has seleccionado la opción 4: Personalización.");
        break;
      default:
        speak("Opción no reconocida, por favor intente nuevamente.");
        break;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {isAuthenticated ? (
          <Text style={styles.welcomeText}>¡Bienvenido a la aplicación!</Text>
        ) : (
          <Text style={styles.authenticatingText}>{authMessage}</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e0f7fa',
  },
  card: {
    width: '90%',
    padding: 20,
    borderRadius: 15,
    backgroundColor: '#5ec2d4',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  authenticatingText: {
    fontSize: 20,
    fontWeight: '500',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 20,
  },
});

export default App;
