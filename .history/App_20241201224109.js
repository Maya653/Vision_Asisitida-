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
  View,
} from 'react-native';
import { registerFingerprint } from './services/fingerprintService'; // Importa la función desde el servicio

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authMessage, setAuthMessage] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isProcessingFingerprint, setIsProcessingFingerprint] = useState(false);
  const [lastTap, setLastTap] = useState(0);
  const [isVoiceCommandEnabled, setIsVoiceCommandEnabled] = useState(false);
  const [isListening, setIsListening] = useState(false); // Estado para saber si está escuchando

  const userId = 'usuarioDana';
  const huellaData = 'huella_en_base64';

  useEffect(() => {
    guideUser();
    Voice.onSpeechStart = () => {
      console.log('Comienzo del reconocimiento de voz');
      setIsListening(true); // Activamos el micrófono
    };
    Voice.onSpeechEnd = () => {
      console.log('Fin del reconocimiento de voz');
      setIsListening(false); // Desactivamos el micrófono
    };
    Voice.onSpeechError = (e) => console.log('Error en el reconocimiento de voz:', e);
    Voice.onSpeechResults = (event) => {
      const command = event.value[0]?.toLowerCase();
      console.log('Comando detectado:', command);
      handleVoiceCommand(command);
    };

    return () => {
      console.log('Limpiando Voice...');
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  const speak = (message) => {
    console.log('Hablando:', message);
    Speech.speak(message, {
      language: 'es-MX',
      pitch: 1,
      rate: 1,
    });
  };

  const guideUser = () => {
    speak(
      "Hola, soy tu app de visión asistida. Bienvenido. Antes de comenzar, por favor toca la pantalla dos veces para habilitar el reconocimiento de voz y luego di 'registrar huella' para registrar una nueva huella, o 'iniciar sesión' si ya tienes una huella registrada."
    );
  };

  const startListening = () => {
    console.log('Iniciando escucha de comandos...');
    Voice.start('es-MX');
    speak('Por favor, diga su comando.');
    setIsVoiceCommandEnabled(true);
  };

  const stopListening = () => {
    Voice.stop();
    setIsVoiceCommandEnabled(false);
  };

  const handleVoiceCommand = (command) => {
    if (command.includes('registrar')) {
      speak('Vamos a registrar tu huella. Coloca el dedo en el sensor y comienza a moverlo en diferentes direcciones.');
      setIsRegistering(true);
      setIsProcessingFingerprint(true);
      stopListening();
    } else if (command.includes('iniciar')) {
      speak('Coloca la huella en el sensor de huella para iniciar sesión.');
      setIsRegistering(false);
      authenticateUser();
      stopListening();
    } else {
      speak("No entendí tu comando. Por favor, repite 'registrar huella' o 'iniciar sesión'.");
      startListening();
    }
  };

  const handleDoubleTap = () => {
    const now = Date.now();
    if (lastTap && now - lastTap < 300) {
      console.log('Pantalla tocada dos veces. Activando reconocimiento de voz...');
      startListening();
    } else {
      setLastTap(now);
    }
  };

  const completeRegistration = () => {
    registerFingerprint(userId, huellaData)
      .then(() => {
        setIsProcessingFingerprint(false);
        speak('El registro fue exitoso. Puedes comenzar a usar Visión Asistida.');
        showAvailableFeatures();
      })
      .catch((error) => {
        console.error('Error al registrar huella:', error);
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
      try {
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
      } catch (error) {
        console.error('Error en autenticación biométrica:', error);
        speak('Hubo un error al intentar autenticar. Intenta nuevamente.');
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
              source={require('./assets/fingerprint.gif')}
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
            {/* Indicador de micrófono cuando está escuchando */}
            {isListening && (
              <View style={styles.micContainer}>
                <Image
                  source={require('./assets/microphone.png')} // Aquí deberías tener una imagen de micrófono
                  style={styles.micIcon}
                />
                <Text style={styles.micText}>Escuchando...</Text>
              </View>
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
    color: '#fff',
    textAlign: 'center',
  },
  featureButton: {
    padding: 10,
    marginTop: 10,
    backgroundColor: '#0295a8',
    borderRadius: 8,
  },
  featureText: {
    fontSize: 18,
    color: '#fff',
  },
  micContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  micIcon: {
    width: 30,
    height: 30,
    marginRight: 10,
  },
  micText: {
    fontSize: 16,
    color: '#ff0000',
  },
  sensorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  sensorImage: {
    width: 150,
    height: 150,
  },
  processingText: {
    marginTop: 20,
    fontSize: 18,
    color: '#ff0000',
  },
});

export default App;
