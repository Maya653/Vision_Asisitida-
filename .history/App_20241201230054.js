import Voice from '@react-native-voice/voice'; // Biblioteca para reconocimiento de voz
import * as LocalAuthentication from 'expo-local-authentication';
import * as Permissions from 'expo-permissions'; // Biblioteca para permisos
import * as Speech from 'expo-speech';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View
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
  const [isListening, setIsListening] = useState(false);

  const userId = 'usuarioDana';
  const huellaData = 'huella_en_base64';

  // Solicitar permisos de audio al iniciar la app
  const requestAudioPermissions = async () => {
    const { status } = await Permissions.askAsync(Permissions.AUDIO_RECORDING);
    if (status !== 'granted') {
      Alert.alert(
        'Permiso requerido',
        'Por favor, otorga acceso al micrófono para usar esta funcionalidad.',
        [{ text: 'OK' }]
      );
    }
  };

  useEffect(() => {
    requestAudioPermissions();
    guideUser();

    Voice.onSpeechStart = () => {
      console.log('Comienzo del reconocimiento de voz');
      setIsListening(true);
    };
    Voice.onSpeechEnd = () => {
      console.log('Fin del reconocimiento de voz');
      setIsListening(false);
    };
    Voice.onSpeechError = (e) => {
      console.log('Error en el reconocimiento de voz:', e);
      setIsListening(false);
    };
    Voice.onSpeechResults = (event) => {
      const command = event.value[0]?.toLowerCase();
      console.log('Comando detectado:', command);
      handleVoiceCommand(command);
    };

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  const speak = (message) => {
    console.log('Hablando:', message);
    Speech.speak(message, {
      language: 'es-ES',
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
      speak('Vamos a registrar tu huella...');
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
      startListening();
    } else {
      setLastTap(now);
    }
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
            speak('Inicio de sesión exitoso.');
            showAvailableFeatures();
          }
        } else {
          handleFailedAuthentication();
        }
      } catch (error) {
        console.error('Error en autenticación biométrica:', error);
        speak('Hubo un error al intentar autenticar.');
      }
    } else {
      speak('No se encontró soporte biométrico.');
    }
  };

  const completeRegistration = () => {
    registerFingerprint(userId, huellaData)
      .then(() => {
        setIsProcessingFingerprint(false);
        speak('El registro fue exitoso.');
      })
      .catch((error) => {
        speak('Hubo un problema al registrar tu huella.');
      });
  };

  return (
    <TouchableWithoutFeedback onPress={handleDoubleTap}>
      <View style={styles.container}>
        <Text style={styles.welcomeText}>¡Bienvenido a la aplicación!</Text>
        {/* Otros componentes */}
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  welcomeText: { fontSize: 20, fontWeight: 'bold' },
});

export default App;
