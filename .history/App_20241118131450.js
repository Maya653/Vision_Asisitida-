import * as LocalAuthentication from 'expo-local-authentication';
import * as Speech from 'expo-speech';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Realizamos la autenticación al iniciar la app
    authenticateUser();
  }, []);

  const speak = (message) => {
    Speech.speak(message, {
      language: 'es-MX', // Español (México)
      pitch: 1,
      rate: 1,
    });
  };

  const authenticateUser = async () => {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const supportedAuthTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();

    if (hasHardware && supportedAuthTypes.length > 0) {
      speak("Bienvenido. Por favor, autentíquese usando su huella o rostro.");
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Autenticación requerida',
        fallbackLabel: 'Intentar de nuevo',
      });

      if (result.success) {
        setIsAuthenticated(true);
        speak("Autenticación exitosa. Bienvenido a la aplicación.");
      } else {
        speak("Autenticación fallida. Inténtelo nuevamente.");
        Alert.alert('Autenticación fallida', 'Inténtalo nuevamente', [
          { text: 'Reintentar', onPress: authenticateUser },
        ]);
      }
    } else {
      speak("No se encontró soporte biométrico. No puede acceder.");
      Alert.alert('Error', 'No se encontró soporte biométrico en su dispositivo.');
    }
  };

  return (
    <View style={styles.container}>
      {isAuthenticated ? (
        <Text style={styles.text}>¡Bienvenido a la aplicación Vision Asistida!</Text>
      ) : (
        <Text style={styles.text}>Autenticando...</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e0f7fa', // Fondo agradable para el diseño de la app
  },
  text: {
    fontSize: 20,
    color: '#00796b', // Texto con buen contraste
    textAlign: 'center',
    margin: 20,
  },
});

export default App;
