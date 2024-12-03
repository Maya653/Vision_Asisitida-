import Voice from '@react-native-voice/voice'; // Biblioteca para reconocimiento de voz
import * as LocalAuthentication from 'expo-local-authentication';
import * as Speech from 'expo-speech';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authMessage, setAuthMessage] = useState("Espere, autenticando...");
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lastTap, setLastTap] = useState(0);
  const [isListening, setIsListening] = useState(false); // Estado para saber si está escuchando

  useEffect(() => {
    Voice.onSpeechResults = onSpeechResults;
    Voice.onSpeechError = onSpeechError;
    return () => {
      Voice.destroy().then(Voice.removeAllListeners); // Limpiar los eventos al desmontar
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

  const startListening = () => {
    if (isListening) return; // Evita iniciar otro reconocimiento si ya está escuchando
    setIsListening(true); // Cambia el estado a 'escuchando'
    Voice.start('es-MX'); // Inicia el reconocimiento de voz en español
    speak("Por favor, diga su comando.");
  };

  const onSpeechResults = (event) => {
    const command = event.value[0]?.toLowerCase(); // Captura el primer resultado en minúsculas
    handleVoiceCommand(command);
  };

  const onSpeechError = (event) => {
    speak("Hubo un error al escuchar el comando. Intenta nuevamente.");
    console.error(event.error);
    setIsListening(false);
  };

  const handleVoiceCommand = (command) => {
    if (command.includes('registrar')) {
      speak("Vamos a registrar tu huella.");
      authenticateUser(true); // Llama al método para registrar la huella
    } else if (command.includes('iniciar')) {
      speak("Vamos a verificar tu huella.");
      authenticateUser(false); // Llama al método para verificar la huella
    } else {
      speak("No entendí tu comando. Por favor, repite 'registrar huella' o 'iniciar sesión'.");
      startListening(); // Reinicia el reconocimiento de voz si no entiende el comando
    }
  };

  const handleDoubleTap = () => {
    const now = Date.now();
    if (lastTap && now - lastTap < 300) {
      // Doble toque detectado
      startListening();
    } else {
      // Primer toque
      setLastTap(now);
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
          speak(
            "Se ha alcanzado el límite de intentos fallidos. Por favor, intente nuevamente más tarde."
          );
          Alert.alert(
            "Intentos fallidos",
            "Has alcanzado el límite de intentos. Vuelve a intentarlo más tarde."
          );
          setFailedAttempts(0);
        }
      }
    } else {
      setAuthMessage(
        "No se encontró soporte biométrico. No puede usar esta aplicación."
      );
      speak(
        "No se encontró ninguna huella que coincida en su dispositivo. No puede usar esta aplicación."
      );
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
              <TouchableOpacity
                style={styles.featureButton}
                onPress={() => speak("Abrir GPS")}
              >
                <Text style={styles.featureText}>GPS</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.featureButton}
                onPress={() => speak("Buscar rutas")}
              >
                <Text style={styles.featureText}>Buscar Rutas</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.featureButton}
                onPress={() => speak("Personalizar la aplicación")}
              >
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
