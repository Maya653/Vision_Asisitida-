import * as Audio from 'expo-av'; // Importamos expo-av para los permisos de audio
import * as ImagePicker from 'expo-image-picker'; // Para permitir la selección de huella (como ejemplo)
import * as LocalAuthentication from 'expo-local-authentication';
import * as Speech from 'expo-speech';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [authMessage, setAuthMessage] = useState("Autenticando...");
  const [userId, setUserId] = useState(null); // Para almacenar el ID del usuario
  const [fingerprint, setFingerprint] = useState(null); // Para almacenar la huella seleccionada

  // Solicitar permisos de micrófono
  const requestPermissions = async () => {
    const { status } = await Audio.requestPermissionsAsync();
    if (status !== 'granted') {
      speak('Permiso para acceder al micrófono denegado. La aplicación no funcionará correctamente.');
    }
  };

  useEffect(() => {
    requestPermissions(); // Solicitar permisos cuando se monta el componente
    authenticateUser(); // Iniciar la autenticación automáticamente
  }, []); // Solo ejecuta una vez al inicio

  // Función para hacer que la app hable
  const speak = (message) => {
    Speech.speak(message, {
      language: 'es-MX',
      pitch: 1,
      rate: 1,
    });
  };

  // Función de autenticación
  const authenticateUser = async () => {
    setAuthMessage("Por favor, autentíquese usando su huella dactilar.");
    speak("Bienvenido. Por favor, autentíquese usando su huella dactilar.");

    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const supportedAuthTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();

    if (hasHardware && supportedAuthTypes.length > 0) {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Autenticación requerida',
        fallbackLabel: 'Intentar de nuevo',
      });

      if (result.success) {
        setIsAuthenticated(true);
        setAuthMessage("Autenticación exitosa. Bienvenido a la aplicación.");
        speak("Autenticación exitosa. Bienvenido a la aplicación.");

        // Aquí podrías registrar la huella del usuario
        // Llamar a una función para registrar la huella en el servidor
        registerFingerprint(); // Función que se llama después de la autenticación exitosa
      } else {
        setFailedAttempts((prev) => prev + 1);
        setAuthMessage("Autenticación fallida. Inténtalo nuevamente.");
        speak("Autenticación fallida. Inténtalo nuevamente.");

        if (failedAttempts >= 2) {
          speak("Se ha alcanzado el límite de intentos fallidos. Por favor, intente nuevamente más tarde.");
          setFailedAttempts(0);
        }
      }
    } else {
      setAuthMessage("No se encontró soporte biométrico. No puede acceder.");
      speak("No se encontró soporte biométrico en su dispositivo. No puede acceder.");
    }
  };

  // Función para registrar la huella del usuario en el servidor PHP
  const registerFingerprint = async () => {
    if (!userId || !fingerprint) {
      speak("No se ha seleccionado ninguna huella.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append('usuario_id', userId);
      formData.append('huella', {
        uri: fingerprint.uri,
        type: 'image/png', // Cambiar el tipo de archivo según sea necesario
        name: 'huella.png',
      });

      const response = await fetch('http://your-server-url/register_fingerprint.php', {
        method: 'POST',
        body: formData,
      });

      const responseData = await response.json();
      if (responseData.success) {
        speak("Huella registrada correctamente.");
      } else {
        speak("Error al registrar la huella.");
      }
    } catch (error) {
      console.error(error);
      speak("Error al intentar registrar la huella.");
    }
  };

  // Función para manejar la selección de huella (simulada por una imagen en este caso)
  const pickFingerprint = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.cancelled) {
      setFingerprint(result);
      speak("Huella seleccionada.");
    } else {
      speak("No se seleccionó ninguna huella.");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {isAuthenticated ? (
          <Text style={styles.welcomeText}>¡Bienvenido a la aplicación!</Text>
        ) : (
          <Text style={styles.authenticatingText}>{authMessage}</Text>
        )}

        {/* Botón para seleccionar la huella */}
        <Text style={styles.button} onPress={pickFingerprint}>Seleccionar Huella</Text>
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
  button: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#00897b',
    color: '#fff',
    borderRadius: 5,
    textAlign: 'center',
  },
});

export default App;
