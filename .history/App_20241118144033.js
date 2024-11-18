import * as LocalAuthentication from 'expo-local-authentication';
import * as Speech from 'expo-speech';
import React, { useEffect, useState } from 'react';
import { Alert, Image, StyleSheet, Text, View } from 'react-native';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null); // Estado para almacenar la opción seleccionada

  useEffect(() => {
    // Realizamos la autenticación al iniciar la app
    authenticateUser();
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

    // Mostrar botones circulares para representar cada módulo
    return (
      <View style={styles.optionsContainer}>
        <View style={styles.optionButton} onTouchEnd={() => handleOptionSelection('GPS')}>
          <Image source={require('./assets/gps-icon.png')} style={styles.icon} />
          <Text style={styles.optionText}>Guía GPS</Text>
        </View>
        <View style={styles.optionButton} onTouchEnd={() => handleOptionSelection('Rutas')}>
          <Image source={require('./assets/routes-icon.png')} style={styles.icon} />
          <Text style={styles.optionText}>Rutas Accesibles</Text>
        </View>
        <View style={styles.optionButton} onTouchEnd={() => handleOptionSelection('Emergencia')}>
          <Image source={require('./assets/emergency-icon.png')} style={styles.icon} />
          <Text style={styles.optionText}>Modo Emergencia</Text>
        </View>
        <View style={styles.optionButton} onTouchEnd={() => handleOptionSelection('Personalizacion')}>
          <Image source={require('./assets/settings-icon.png')} style={styles.icon} />
          <Text style={styles.optionText}>Personalización</Text>
        </View>
      </View>
    );
  };

  const handleOptionSelection = async (option) => {
    setSelectedOption(option);
    speak(`Seleccionaste la opción ${option}. ¿Es eso correcto? Por favor, confirma.`);
    // Aquí añadirás lógica para manejar la confirmación del usuario.

    // Simulación de espera de confirmación:
    await new Promise(resolve => setTimeout(resolve, 2000));

    Alert.alert('Confirmación', `¿Quieres usar la opción ${option}?`, [
      { text: 'Sí', onPress: () => proceedToOption(option) },
      { text: 'No', onPress: () => setSelectedOption(null) },
    ]);
  };

  const proceedToOption = (option) => {
    speak(`Accediendo a ${option}...`);
    // Aquí añadir la lógica para acceder a la funcionalidad seleccionada.
    switch (option) {
      case 'GPS':
        // Aquí manejar la navegación GPS
        break;
      case 'Rutas':
        // Mostrar rutas accesibles
        break;
      case 'Emergencia':
        // Activar modo de emergencia
        break;
      case 'Personalizacion':
        // Acceder a configuración de la aplicación
        break;
      default:
        break;
    }
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
            <Image source={require('./assets/image.png')} style={styles.icon} />
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
  icon: {
    width: 40,
    height: 40,
  },
  optionText: {
    color: '#fff',
    fontWeight: 'bold',
    marginTop: 10,
  },
});

export default App;
