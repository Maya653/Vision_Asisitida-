import Voice from '@react-native-voice/voice';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Speech from 'expo-speech';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  PermissionsAndroid,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

async function requestMicrophonePermission() {
  if (Platform.OS === 'android') {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: "Permiso para usar el micrófono",
          message: "Esta aplicación necesita acceso al micrófono para habilitar el reconocimiento de voz.",
          buttonNeutral: "Preguntar después",
          buttonNegative: "Cancelar",
          buttonPositive: "Aceptar",
        }
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log("Permiso de micrófono concedido.");
      } else {
        console.log("Permiso de micrófono denegado.");
      }
    } catch (err) {
      console.warn(err);
    }
  }
}

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authMessage, setAuthMessage] = useState("Espere, autenticando...");
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lastTap, setLastTap] = useState(0);

  useEffect(() => {
    requestMicrophonePermission();
    guideUser();

    // Configuración de eventos para Voice
    Voice.onSpeechResults = (event) => {
      const command = event.value[0]?.toLowerCase(); // Captura el primer resultado en minúsculas
      handleVoiceCommand(command);
    };

    Voice.onSpeechError = (error) => {
      console.error("Error de reconocimiento de voz:", error);
      speak("Hubo un error al reconocer tu comando. Por favor, intenta nuevamente.");
    };

    return () => {
      Voice.destroy().then(Voice.removeAllListeners); // Limpieza de eventos
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
    speak(
      "Hola, soy tu app de visión asistida. Bienvenido. Antes de comenzar, por favor di 'registrar huella' para registrar una nueva huella, o 'iniciar sesión' si ya tienes una huella registrada."
    );
  };

  const startListening = async () => {
    try {
      await Voice.start('es-MX');
      speak("Por favor, diga su comando.");
    } catch (error) {
      console.error("Error al iniciar el reconocimiento de voz:", error);
      speak("No se pudo iniciar el reconocimiento de voz. Intenta nuevamente.");
    }
  };

  const handleVoiceCommand = (command) => {
    Voice.stop(); // Detiene el reconocimiento de voz después de obtener el comando

    if (command.includes('registrar')) {
      speak("Vamos a registrar tu huella.");
      authenticateUser(true);
    } else if (command.includes('iniciar')) {
      speak("Vamos a verificar tu huella.");
      authenticateUser(false);
    } else {
      speak("No entendí tu comando. Por favor, repite 'registrar huella' o 'iniciar sesión'.");
      startListening();
    }
  };

  const handleDoubleTap = () => {
    const now = Date.now();
    if (lastTap && now - lastTap < 300) {
      startListening(); // Doble toque detectado
    } else {
      setLastTap(now); // Primer toque
    }
  };

  const authenticateUser = async (isRegistering) => {
    const message = isRegistering
      ? "Por favor, registre su huella dactilar."
      : "Por favor, coloque su dedo en el lector de huellas para iniciar sesión.";
    setAuthMessage(message);
    speak(message);

    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const supportedAuthTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();

    if (hasHardware && supportedAuthTypes.length > 0) {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: isRegistering ? 'Registro de huella' : 'Autenticación biométrica',
        fallbackLabel: 'Intentar de nuevo',
        disableDeviceFallback: true,
      });

      if (result.success) {
        setIsAuthenticated(true);
        const successMessage = isRegistering
          ? "Registro exitoso. Bienvenido a la aplicación."
          : "Inicio de sesión exitoso. Bienvenido a la aplicación.";
        setAuthMessage(successMessage);
        speak(successMessage);
        showAvailableFeatures();
      } else {
        setFailedAttempts((prev) => prev + 1);
        setAuthMessage("Intento fallido. Inténtalo nuevamente.");
        speak("Intento fallido. Inténtalo nuevamente.");

        if (failedAttempts >= 2) {
          speak("Se ha alcanzado el límite de intentos fallidos. Por favor, intente nuevamente más tarde.");
          Alert.alert("Intentos fallidos", "Has alcanzado el límite de intentos. Vuelve a intentarlo más tarde.");
          setFailedAttempts(0);
        }
      }
    } else {
      setAuthMessage("No se encontró soporte biométrico. No puede usar esta aplicación.");
      speak("No se encontró soporte biométrico. No puede usar esta aplicación.");
    }
  };

  const showAvailableFeatures = () => {
    speak(
      "Ahora puede usar la aplicación. Las funcionalidades disponibles son: buscar rutas, abrir el GPS y personalizar la aplicación. Diga el nombre de la función que desea usar."
    );
  };

  return (
    <TouchableWithoutFeedback onPress={handleDoubleTap}>
      <View style={styles.container}>
        <View style={styles.card}>
          {isAuthenticated ? (
            <>
              <Text style={styles.welcomeText}>¡Bienvenido a la aplicación!</Text>
              <TouchableOpacity style={styles.featureButton} onPress={() => speak("Abrir GPS")}>
                <Text style={styles.featureText}>GPS</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.featureButton} onPress={() => speak("Buscar rutas")}>
                <Text style={styles.featureText}>Buscar Rutas</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.featureButton} onPress={() => speak("Personalizar la aplicación")}>
                <Text style={styles.featureText}>Personalización</Text>
              </TouchableOpacity>
            </>
          ) : (
            <Text style={styles.authenticatingText}>{authMessage}</Text>
          )}
        </View>
      </View>
    </TouchableWithoutFeedback>
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
