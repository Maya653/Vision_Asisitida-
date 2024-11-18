import Voice from '@react-native-community/voice';
import * as Audio from 'expo-av'; // Importamos expo-av para los permisos de audio
import * as LocalAuthentication from 'expo-local-authentication';
import * as Speech from 'expo-speech';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isListening, setIsListening] = useState(false);

  // Solicitar permisos de micrófono
  const requestPermissions = async () => {
    const { status } = await Audio.requestPermissionsAsync();
    if (status !== 'granted') {
      alert('Permiso para acceder al micrófono denegado');
    }
  };

  useEffect(() => {
    requestPermissions(); // Solicitar permisos cuando se monta el componente
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      displayOptions();
    }
  }, [isAuthenticated]); // Solo vuelve a ejecutar cuando `isAuthenticated` cambia

  useEffect(() => {
    // Configuración para el reconocimiento de voz
    Voice.onSpeechResults = onSpeechResults;
    Voice.onSpeechError = onSpeechError;

    return () => {
      Voice.destroy().then(Voice.removeAllListeners); // Limpiar cuando el componente se desmonte
    };
  }, []);

  const speak = (message) => {
    Speech.speak(message, {
      language: 'es-MX',
      pitch: 1,
      rate: 1,
    });
  };

  const authenticateUser = async () => {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const supportedAuthTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();

    if (hasHardware && supportedAuthTypes.length > 0) {
      speak("Bienvenido. Por favor, autentíquese usando su huella.");

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Autenticación requerida',
        fallbackLabel: 'Intentar de nuevo',
      });

      if (result.success) {
        setIsAuthenticated(true);
        speak("Autenticación exitosa. Bienvenido a la aplicación.");
      } else {
        setFailedAttempts(prev => prev + 1);
        speak("Autenticación fallida. Inténtelo nuevamente.");

        if (failedAttempts >= 2) {
          Alert.alert('Autenticación fallida', 'Se ha alcanzado el límite de intentos fallidos. Por favor, intente nuevamente más tarde.');
          setFailedAttempts(0);
        } else {
          Alert.alert('Autenticación fallida', 'Inténtalo nuevamente', [
            { text: 'Reintentar', onPress: authenticateUser },
          ]);
        }
      }
    } else {
      speak("No se encontró soporte biométrico. No puede acceder.");
      Alert.alert('Error', 'No se encontró soporte biométrico en su dispositivo.');
    }
  };

  const displayOptions = () => {
    speak("Las funciones de tu aplicación son las siguientes.");
    speak("Opción 1: Guia GPS.");
    speak("Opción 2: Rutas accesibles para el transporte público.");
    speak("Opción 3: Modo de emergencia.");
    speak("Opción 4: Personalización de la aplicación.");
    speak("Por favor, diga el número de la opción que desea seleccionar.");
    setIsListening(true); // Permitir la escucha después de mostrar las opciones
  };

  const onSpeechResults = (event) => {
    const result = event.value[0]; // Obtener la primera opción reconocida
    speak(`Has dicho ${result}. Verificando la opción...`);

    switch (result) {
      case '1':
        handleOptionSelection('GPS');
        break;
      case '2':
        handleOptionSelection('Rutas');
        break;
      case '3':
        handleOptionSelection('Emergencia');
        break;
      case '4':
        handleOptionSelection('Personalizacion');
        break;
      default:
        speak("Lo siento, no reconozco esa opción. Intenta de nuevo.");
        break;
    }
  };

  const onSpeechError = (event) => {
    speak("Hubo un error al reconocer tu voz. Por favor, intenta nuevamente.");
  };

  const handleOptionSelection = (option) => {
    setSelectedOption(option);
    speak(`Seleccionaste la opción ${option}. ¿Es eso correcto? Por favor, confirma.`);
    // Aquí puedes añadir la lógica para confirmar con el usuario si es la opción correcta.
  };

  const proceedToOption = (option) => {
    speak(`Accediendo a ${option}...`);
    // Aquí añadir la lógica para acceder a la funcionalidad seleccionada.
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {isAuthenticated ? (
          <>
            <Text style={styles.welcomeText}>¡Bienvenido a la aplicación!</Text>
            <View style={styles.optionsContainer}>
              <View style={styles.optionButton}>
                <Icon name="location-on" size={40} color="#fff" />
                <Text style={styles.optionText}>Guía GPS</Text>
              </View>
              <View style={styles.optionButton}>
                <Icon name="directions-transit" size={40} color="#fff" />
                <Text style={styles.optionText}>Rutas Accesibles</Text>
              </View>
              <View style={styles.optionButton}>
                <Icon name="error-outline" size={40} color="#fff" />
                <Text style={styles.optionText}>Modo Emergencia</Text>
              </View>
              <View style={styles.optionButton}>
                <Icon name="settings" size={40} color="#fff" />
                <Text style={styles.optionText}>Personalización</Text>
              </View>
            </View>
          </>
        ) : (
          <Text style={styles.authenticatingText}>Autenticando...</Text>
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
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  optionButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#4db6ac',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  optionText: {
    color: '#fff',
    fontWeight: 'bold',
    marginTop: 10,
  },
});

export default App;
