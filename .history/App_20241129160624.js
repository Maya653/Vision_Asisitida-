import * as LocalAuthentication from 'expo-local-authentication';
import * as Speech from 'expo-speech';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authMessage, setAuthMessage] = useState("Espere, autenticando...");
  const [failedAttempts, setFailedAttempts] = useState(0);

  useEffect(() => {
    guideUser();
    authenticateUser();
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
      "Bienvenido a la aplicación. Para comenzar,coloque su dedo en el lector de huellas."
    );
  };

  const authenticateUser = async () => {
    setAuthMessage("Por favor, registre su huella dactilar.");
    speak("Por favor, registre su huella dactilar.");

    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const supportedAuthTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();

    if (hasHardware && supportedAuthTypes.length > 0) {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Registro de huella dactilar requerido',
        fallbackLabel: 'Intentar de nuevo',
        disableDeviceFallback: true, // La funcion del PIN se desactivo
      });

      if (result.success) {
        setIsAuthenticated(true);
        setAuthMessage("Registro exitoso. Bienvenido a la aplicación.");
        speak("Registro exitoso. Bienvenido a la aplicación.");
        showAvailableFeatures();
      } else {
        setFailedAttempts((prev) => prev + 1);
        setAuthMessage("Registro fallido. Inténtalo nuevamente.");
        speak("Registro fallido. Inténtalo nuevamente.");

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