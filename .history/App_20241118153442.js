import Voice from '@react-native-community/voice';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Speech from 'expo-speech';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isListening, setIsListening] = useState(false); // Estado para indicar si está escuchando

  useEffect(() => {
    // Realizamos la autenticación al iniciar la app
    authenticateUser();

    // Configuración para el reconocimiento de voz
    Voice.onSpeechResults = onSpeechResults;
    Voice.onSpeechError = onSpeechError;
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
        displayOptions(); // Muestra las opciones disponibles después de la autenticación
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
    speak("Si deseas que las opciones se repitan, por favor di 'repetir opciones'.");
    speak("Por favor, diga el número de la opción que desea seleccionar.");

    // Comienza a escuchar después de que se hayan leído las opciones
    listenForUserCommand();
  };

  // Función para comenzar a escuchar los comandos del usuario
  const listenForUserCommand = () => {
    setIsListening(true);
    Voice.start('es-MX');
  };

  // Función que maneja los resultados del reconocimiento de voz
  const onSpeechResults = (event) => {
    const result = event.value[0]; // Obtener la primera opción reconocida
    speak(`Has dicho ${result}. Verificando la opción...`);

    if (result === 'repetir opciones') {
      // Si el usuario pide repetir las opciones, las volvemos a leer
      speak("Repetiré las opciones.");
      displayOptions();
    } else {
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
    }

    // Detenemos la escucha después de obtener la opción
    stopListening();
  };

  const onSpeechError = (event) => {
    speak("Hubo un error al reconocer tu voz. Por favor, intenta nuevamente.");
    stopListening();
  };

  const handleOptionSelection = (option) => {
    setSelectedOption(option);
    speak(`Seleccionaste la opción ${option}. ¿Es eso correcto? Por favor, confirma.`);
    // Aquí puedes añadir la lógica para confirmar con el usuario si es la opción correcta.
  };

  const stopListening = () => {
    setIsListening(false);
    Voice.stop();
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {isAuthenticated ? (
          <>
            <Text style={styles.welcomeText}>¡Bienvenido a la aplicación!</Text>
            {displayOptions()}
          </>
        ) : (
          <>
            <Text style={styles.authenticatingText}>Autenticando...</Text>
          </>
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
