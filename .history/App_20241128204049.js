import * as LocalAuthentication from 'expo-local-authentication';
import * as Speech from 'expo-speech';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Voice from 'react-native-voice';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authMessage, setAuthMessage] = useState("Espere, autenticando...");
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [voiceCommand, setVoiceCommand] = useState("");

  useEffect(() => {
    Voice.onSpeechResults = onSpeechResults;
    guideUser();
    authenticateUser();
    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  const speak = (message) => {
    Speech.speak(message, {
      language: 'es-MX',
      pitch: 1,
      rate: 1,
    });
  };

  const guideUser = () => {
    speak("Bienvenido a la aplicación. Para comenzar, coloque su dedo en el lector de huellas.");
  };

  const authenticateUser = async () => {
    setAuthMessage("Por favor, registre su huella dactilar.");
    speak("Por favor, registre su huella dactilar.");

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
        showAvailableFeatures();
      } else {
        setFailedAttempts((prev) => prev + 1);
        setAuthMessage("Registro fallido. Inténtalo nuevamente.");
        speak("Registro fallido. Inténtalo nuevamente.");

        if (failedAttempts >= 2) {
          speak("Se ha alcanzado el límite de intentos fallidos. Por favor, intente nuevamente más tarde.");
          Alert.alert("Intentos fallidos", "Has alcanzado el límite de intentos. Vuelve a intentarlo más tarde.");
          setFailedAttempts(0);
        }
      }
    } else {
      setAuthMessage("No se encontró soporte biométrico. No puede usar esta aplicación.");
      speak("No se encontró ninguna huella que coincida en su dispositivo. No puede usar esta aplicación.");
    }
  };

  const showAvailableFeatures = () => {
    speak("Ahora puede usar la aplicación. Las funcionalidades disponibles son: buscar rutas, abrir el GPS y personalizar la aplicación. Diga el nombre de la función que desea usar.");
  };

  const onSpeechResults = (event) => {
    const command = event.value[0].toLowerCase();
    setVoiceCommand(command);
    processCommand(command);
  };

  const processCommand = (command) => {
    if (command.includes("gps")) {
      speak("Abriendo GPS");
    } else if (command.includes("rutas")) {
      speak("Buscando rutas disponibles");
    } else if (command.includes("personalizar")) {
      speak("Abriendo configuración de personalización");
    } else {
      speak("No entendí el comando. Por favor, intente de nuevo.");
    }
  };

  const startListening = async () => {
    try {
      setIsListening(true);
      await Voice.start("es-MX");
    } catch (error) {
      console.error("Error iniciando reconocimiento de voz:", error);
    }
  };

  const stopListening = async () => {
    try {
      setIsListening(false);
      await Voice.stop();
    } catch (error) {
      console.error("Error deteniendo reconocimiento de voz:", error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {isAuthenticated ? (
          <>
            <Text style={styles.welcomeText}>¡Bienvenido a la aplicación!</Text>
            <TouchableOpacity
              style={styles.featureButton}
              onPress={startListening}
            >
              <Text style={styles.featureText}>Activar Comando de Voz</Text>
            </TouchableOpacity>
            {isListening && (
              <TouchableOpacity
                style={styles.featureButton}
                onPress={stopListening}
              >
                <Text style={styles.featureText}>Detener Escucha</Text>
              </TouchableOpacity>
            )}
            <Text style={styles.commandText}>
              Último comando: {voiceCommand || "Ninguno"}
            </Text>
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
  commandText: {
    marginTop: 20,
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
  },
});

export default App;
