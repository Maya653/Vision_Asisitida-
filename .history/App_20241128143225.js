import * as LocalAuthentication from 'expo-local-authentication';
import * as Speech from 'expo-speech';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Voice from 'react-native-voice'; // Importar Voice

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authMessage, setAuthMessage] = useState("Espere, autenticando...");
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [spokenText, setSpokenText] = useState('');

  useEffect(() => {
    guideUser();
    authenticateUser();
    Voice.onSpeechResults = onSpeechResults; // Vincular resultados del reconocimiento
  }, []);

  const speak = (message) => {
    Speech.speak(message, {
      language: 'es-MX',
      pitch: 1,
      rate: 1,
    });
  };

  const guideUser = () => {
    speak(
      "Bienvenido a la aplicación. Para comenzar, debe registrar su huella dactilar. Por favor, coloque su dedo en el lector de huellas."
    );
  };

  const authenticateUser = async () => {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const supportedAuthTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();

    if (hasHardware && supportedAuthTypes.length > 0) {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Registro de huella dactilar requerido',
        fallbackLabel: 'Intentar de nuevo',
        disableDeviceFallback: true,
      });

      if (result.success) {
        setIsAuthenticated(true);
        setAuthMessage("Registro exitoso. Bienvenido a la aplicación.");
        speak("Registro exitoso. Bienvenido a la aplicación.");
        startListening(); // Inicia escucha de comandos
      } else {
        handleFailedAttempt();
      }
    } else {
      setAuthMessage("No se encontró soporte biométrico.");
      speak("No se encontró soporte biométrico en su dispositivo.");
    }
  };

  const handleFailedAttempt = () => {
    setFailedAttempts((prev) => prev + 1);
    speak("Registro fallido. Inténtalo nuevamente.");

    if (failedAttempts >= 2) {
      speak("Límite de intentos fallidos. Intenta más tarde.");
      Alert.alert("Intentos fallidos", "Has alcanzado el límite.");
      setFailedAttempts(0);
    }
  };

  const startListening = async () => {
    try {
      speak("Diga un comando, como abrir GPS o buscar rutas.");
      await Voice.start('es-MX'); // Inicia la escucha
    } catch (error) {
      console.error("Error al iniciar Voice: ", error);
    }
  };

  const onSpeechResults = (event) => {
    const text = event.value[0]; // Captura el texto reconocido
    setSpokenText(text);

    if (text.includes("GPS")) {
      speak("Abriendo GPS.");
    } else if (text.includes("rutas")) {
      speak("Buscando rutas.");
    } else {
      speak("Comando no reconocido.");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {isAuthenticated ? (
          <>
            <Text style={styles.welcomeText}>¡Bienvenido a la aplicación!</Text>
            <Text style={styles.spokenText}>Último comando: {spokenText}</Text>
            <TouchableOpacity
              style={styles.featureButton}
              onPress={startListening}
            >
              <Text style={styles.featureText}>Escuchar comando</Text>
            </TouchableOpacity>
          </>
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
  spokenText: {
    fontSize: 16,
    color: '#fff',
    marginVertical: 10,
  },
  authenticatingText: {
    fontSize: 20,
    fontWeight: '500',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 20,
  },
  featureButton: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#00897b',
    borderRadius: 5,
    width: '80%',
    alignItems: 'center',
  },
  featureText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default App;
