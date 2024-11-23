import * as LocalAuthentication from 'expo-local-authentication';
import * as Speech from 'expo-speech';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authMessage, setAuthMessage] = useState("Espere, autenticando.");
  const [failedAttempts, setFailedAttempts] = useState(0);

  useEffect(() => {
    // Cuando la app inicia, explica los comandos y autentica al usuario
    guideUser();
    authenticateUser();
  }, []);

  // Función para que la app hable mensajes
  const speak = (message) => {
    Speech.speak(message, {
      language: 'es-MX',
      pitch: 1,
      rate: 1,
    });
  };

  // Guía inicial de comandos
  const guideUser = () => {
    speak(
      "Bienvenido a la aplicación. Para empezar, debe registrar su huella dactilar. Por favor, coloque su dedo en el lector de huellas. Luego podrá interactuar con la aplicación usando comandos de voz."
    );
  };

  // Autenticación biométrica
  const authenticateUser = async () => {
    setAuthMessage("Por favor, autentíquese usando su huella dactilar.");
    speak("Por favor, autentíquese usando su huella dactilar.");

    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();

    if (hasHardware && isEnrolled) {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Autenticación requerida',
        fallbackLabel: 'Intentar de nuevo',
      });

      if (result.success) {
        setIsAuthenticated(true);
        setAuthMessage("Autenticación exitosa. Bienvenido a la aplicación.");
        speak("Autenticación exitosa. Bienvenido a la aplicación.");
        showAvailableCommands(); // Mostrar comandos disponibles después de la autenticación
      } else {
        setFailedAttempts((prev) => prev + 1);
        setAuthMessage("Autenticación fallida. Inténtalo nuevamente.");
        speak("Autenticación fallida. Inténtalo nuevamente.");

        if (failedAttempts >= 2) {
          speak(
            "Se ha alcanzado el límite de intentos fallidos. Por favor, intente nuevamente más tarde."
          );
          setFailedAttempts(0);
        }
      }
    } else {
      setAuthMessage(
        "No se encontró soporte biométrico en su dispositivo. No puede acceder."
      );
      speak(
        "No se encontró soporte biométrico en su dispositivo. No puede acceder."
      );
    }
  };

  // Mostrar los comandos disponibles
  const showAvailableCommands = () => {
    speak(
      "Ahora puede usar comandos de voz. Por ejemplo: diga 'Ver tareas', 'Agregar nueva tarea' o 'Salir' para cerrar la aplicación."
    );
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
