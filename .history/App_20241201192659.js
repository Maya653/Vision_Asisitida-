import Voice from '@react-native-voice/voice'; // Biblioteca para reconocimiento de voz
import * as LocalAuthentication from 'expo-local-authentication';
import * as Speech from 'expo-speech';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import { registerFingerprint } from './services/fingerprintService'; // Importa la función desde el servicio

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authMessage, setAuthMessage] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isProcessingFingerprint, setIsProcessingFingerprint] = useState(false); // Para mostrar el sensor
  const [lastTap, setLastTap] = useState(0);

  const userId = 'usuarioDana';
  const huellaData = 'huella_en_base64'; // Datos de la huella

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
      "Hola, soy tu app de visión asistida. Bienvenido. Antes de comenzar, por favor di 'registrar huella' para registrar una nueva huella, o 'iniciar sesión' si ya tienes una huella registrada."
    );
  };

  const startListening = () => {
    Voice.onSpeechResults = (event) => {
      const command = event.value[0]?.toLowerCase();
      handleVoiceCommand(command);
    };

    Voice.start('es-MX');
    speak('Por favor, diga su comando.');
  };

  const handleVoiceCommand = (command) => {
    if (command.includes('registrar')) {
      speak('Vamos a registrar tu huella. Coloca el dedo en el sensor y comienza a moverlo en diferentes direcciones.');
      setIsRegistering(true);
      setIsProcessingFingerprint(true); // Activa la simulación del sensor
    } else if (command.includes('iniciar')) {
      speak('Coloca la huella en el sensor de huella para iniciar sesión.');
      setIsRegistering(false);
      authenticateUser();
    } else {
      speak("No entendí tu comando. Por favor, repite 'registrar huella' o 'iniciar sesión'.");
      startListening();
    }
  };

  const handleDoubleTap = () => {
    const now = Date.now();
    if (lastTap && now - lastTap < 300) {
      startListening();
    } else {
      setLastTap(now);
    }
  };

  const completeRegistration = () => {
    registerFingerprint(userId, huellaData)
      .then(() => {
        setIsProcessingFingerprint(false); // Oculta el sensor
        speak('El registro fue exitoso. Puedes comenzar a usar Visión Asistida.');
        showAvailableFeatures();
      })
      .catch(() => {
        speak('Hubo un problema al registrar tu huella. Inténtalo nuevamente.');
      });
  };

  const authenticateUser = async () => {
    const message = isRegistering
      ? 'Por favor, registre su huella dactilar.'
      : 'Por favor, coloque su dedo en el lector de huellas.';
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
        if (isRegistering) {
          completeRegistration();
        } else {
          setIsAuthenticated(true);
          speak('Inicio de sesión exitoso. Bienvenido a la aplicación.');
          showAvailableFeatures();
        }
      } else {
        handleFailedAuthentication();
      }
    } else {
      speak('No se encontró soporte biométrico. No puede usar esta aplicación.');
    }
  };

  const handleFailedAuthentication = () => {
    setFailedAttempts((prev) => prev + 1);
    if (failedAttempts >= 2) {
      speak('Se ha alcanzado el límite de intentos fallidos. Intenta nuevamente más tarde.');
      Alert.alert('Intentos fallidos', 'Has alcanzado el límite de intentos. Vuelve más tarde.');
      setFailedAttempts(0);
    } else {
      speak('Intento fallido. Inténtalo nuevamente.');
    }
  };

  const showAvailableFeatures = () => {
    speak('Las funcionalidades disponibles son: buscar rutas, abrir el GPS y personalizar la aplicación.');
  };

  return (
    <TouchableWithoutFeedback onPress={handleDoubleTap}>
      <View style={styles.container}>
        {isProcessingFingerprint ? (
          <View style={styles.sensorContainer}>
            <Image
              source={require('./assets/fingerprint.gif')} // Reemplaza con tu animación o imagen de huella
              style={styles.sensorImage}
            />
            <Text style={styles.processingText}>Procesando huella...</Text>
          </View>
        ) : (
          <View style={styles.card}>
            {isAuthenticated ? (
              <>
                <Text style={styles.welcomeText}>¡Bienvenido a la aplicación!</Text>
                <TouchableOpacity
                  style={styles.featureButton}
                  onPress={() => speak('Abrir GPS')}
                >
                  <Text style={styles.featureText}>GPS</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.featureButton}
                  onPress={() => speak('Buscar rutas')}
                >
                  <Text style={styles.featureText}>Buscar Rutas</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.featureButton}
                  onPress={() => speak('Personalizar la aplicación')}
                >
                  <Text style={styles.featureText}>Personalización</Text>
                </TouchableOpacity>
              </>
            ) : (
              <Text style={styles.authenticatingText}>{authMessage}</Text>
            )}
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
  sensorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  sensorImage: {
    width: 150,
    height: 150,
    marginBottom: 20,
  },
  processingText: {
    fontSize: 18,
    color: '#000',
  },
});

export default App;
