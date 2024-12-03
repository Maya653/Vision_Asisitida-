import * as LocalAuthentication from 'expo-local-authentication';
import * as Speech from 'expo-speech';
import * as SpeechRecognizer from 'expo-speech-recognition';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authMessage, setAuthMessage] = useState("Espere, autenticando...");
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [registeredUsers, setRegisteredUsers] = useState([]); // Usuarios registrados
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    guideUser();
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
      "Bienvenido a la aplicación. Diga iniciar sesión para autenticar, o diga registrar usuario para agregar un nuevo usuario."
    );
    startListening();
  };

  const startListening = async () => {
    setIsListening(true);
    const { granted } = await SpeechRecognizer.requestPermissionsAsync();

    if (!granted) {
      setAuthMessage(
        "Permiso de reconocimiento de voz denegado. No puede usar esta funcionalidad."
      );
      speak(
        "El permiso de reconocimiento de voz fue denegado. No puede usar esta funcionalidad."
      );
      return;
    }

    SpeechRecognizer.startAsync({
      language: "es-MX",
      onResult: handleVoiceCommand,
    });
  };

  const handleVoiceCommand = ({ value }) => {
    setIsListening(false);
    const command = value[0]?.toLowerCase(); // Obtenemos el primer resultado y lo normalizamos

    if (command.includes("iniciar sesión")) {
      authenticateUser();
    } else if (command.includes("registrar usuario")) {
      registerNewUser();
    } else {
      speak("Comando no reconocido. Inténtelo nuevamente.");
      guideUser();
    }
  };

  const authenticateUser = async () => {
    setAuthMessage("Por favor, autentíquese con su huella dactilar.");
    speak("Por favor, autentíquese con su huella dactilar.");

    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const supportedAuthTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();

    if (hasHardware && supportedAuthTypes.length > 0) {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Autenticación requerida',
        fallbackLabel: 'Intentar de nuevo',
        disableDeviceFallback: true,
      });

      if (result.success) {
        if (registeredUsers.length > 0) {
          setIsAuthenticated(true);
          setAuthMessage("Autenticación exitosa. Bienvenido de nuevo.");
          speak("Autenticación exitosa. Bienvenido de nuevo.");
          showAvailableFeatures();
        } else {
          setAuthMessage("No hay usuarios registrados. Registre uno primero.");
          speak("No hay usuarios registrados. Registre uno primero.");
        }
      } else {
        handleFailedAttempts();
      }
    } else {
      setAuthMessage(
        "No se encontró soporte biométrico. No puede usar esta aplicación."
      );
      speak(
        "No se encontró soporte biométrico. No puede usar esta aplicación."
      );
    }
  };

  const registerNewUser = async () => {
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
        setRegisteredUsers([...registeredUsers, { id: Date.now() }]);
        setAuthMessage("Usuario registrado exitosamente.");
        speak("Usuario registrado exitosamente.");
      } else {
        handleFailedAttempts();
      }
    } else {
      setAuthMessage(
        "No se encontró soporte biométrico. No puede usar esta aplicación."
      );
      speak(
        "No se encontró soporte biométrico. No puede usar esta aplicación."
      );
    }
  };

  const handleFailedAttempts = () => {
    setFailedAttempts((prev) => prev + 1);
    setAuthMessage("Intento fallido. Inténtalo nuevamente.");
    speak("Intento fallido. Inténtalo nuevamente.");

    if (failedAttempts >= 2) {
      speak(
        "Se ha alcanzado el límite de intentos fallidos. Por favor, intente nuevamente más tarde."
      );
      Alert.alert(
        "Intentos fallidos",
        "Has alcanzado el límite de intentos. Vuelve a intentarlo más tarde."
      );
      setFailedAttempts(0);
    }
  };

  const showAvailableFeatures = () => {
    speak(
      "Ahora puede usar la aplicación. Las funcionalidades disponibles son: buscar rutas, abrir el GPS y personalizar la aplicación. Diga el nombre de la función que desea usar."
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.authenticatingText}>{authMessage}</Text>
        {!isListening && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={startListening}
          >
            <Text style={styles.featureText}>Escuchar Comando de Voz</Text>
          </TouchableOpacity>
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
});

export default App;