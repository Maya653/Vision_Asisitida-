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

  const userId = 'usuarioDana';
  const huellaData = 'huella_en_base64';

  useEffect(() => {
    guideUser();
    Voice.onSpeechStart = () => console.log('Comienzo del reconocimiento de voz');
    Voice.onSpeechEnd = () => console.log('Fin del reconocimiento de voz');
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
  };

  const handleVoiceCommand = (command) => {
    if (command.includes('registrar')) {
      speak('Vamos a registrar tu huella. Coloca el dedo en el sensor y comienza a moverlo en diferentes direcciones.');
      setIsRegistering(true);
      setIsProcessingFingerprint(true);
      Voice.stop();
    } else if (command.includes('iniciar')) {
      speak('Coloca la huella en el sensor de huella para iniciar sesión.');
      setIsRegistering(false);
      authenticateUser();
      Voice.stop();
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
          </View>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  /* Estilos anteriores completos */
});

export default App;
