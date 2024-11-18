import * as LocalAuthentication from 'expo-local-authentication';
import * as Speech from 'expo-speech';
import React, { useEffect, useState } from 'react';
import { Alert, Image, StyleSheet, Text, View } from 'react-native';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0); // Contador de intentos fallidos

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
      speak("Bienvenido. Por favor, autentíquese usando su huella.");

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Autenticación requerida',
        fallbackLabel: 'Intentar de nuevo',
      });

      if (result.success) {
        setIsAuthenticated(true);
        speak("Autenticación exitosa. Bienvenido a la aplicación.");
        setFailedAttempts(0); // Reiniciar el contador si la autenticación es exitosa
      } else {
        setFailedAttempts(prev => prev + 1); // Aumentar el contador de intentos fallidos
        speak("Autenticación fallida. Inténtelo nuevamente.");

        if (failedAttempts >= 2) { // Si ya hubo 3 intentos fallidos
          Alert.alert('Autenticación fallida', 'Se ha alcanzado el límite de intentos fallidos. Por favor, intente nuevamente más tarde.');
          setFailedAttempts(0); // Reiniciar contador después de 3 intentos fallidos
        } else {
          Alert.alert('Autenticación fallida', 'Inténtalo nuevamente', [
            { text: 'Reintentar', onPress: authenticateUser },
          ]);
        }
      }
    } else {
      speak("No se encontró soporte biométrico. No puede acceder.");
      Alert.alert('Error', 'No se encontró soporte biométrico en su dispositivo.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {isAuthenticated ? (
          <Text style={styles.welcomeText}>¡Bienvenido a la aplicación!</Text> // Mensaje de bienvenida
        ) : (
          <>
            <Text style={styles.authenticatingText}>Autenticando...</Text>
            <Image
              source={require('./assets/image.png')} // Un ícono o animación de carga en tu carpeta 'assets'
              style={styles.icon}
            />
          </>
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
    backgroundColor: '#e0f7fa', // Fondo claro y amigable
  },
  card: {
    width: '90%',
    padding: 20,
    borderRadius: 15,
    backgroundColor: '#5ec2d4', // Color principal
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5, // Sombra para Android
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
  icon: {
    width: 100,
    height: 100,
    marginTop: 20,
  },
});

export default App;
