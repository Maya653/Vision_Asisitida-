import * as LocalAuthentication from 'expo-local-authentication';
import * as Speech from 'expo-speech';
import * as SMS from 'expo-sms';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View, Alert, Linking } from 'react-native';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authMessage, setAuthMessage] = useState('Espere, autenticando...');
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [emergencyContact, setEmergencyContact] = useState('');
  const [inputVisible, setInputVisible] = useState(false);

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
      'Bienvenido a la aplicación. Para comenzar, registre su huella dactilar. Por favor, coloque su dedo en el lector de huellas.'
    );
  };

  const authenticateUser = async () => {
    setAuthMessage('Por favor, registre su huella dactilar.');
    speak('Por favor, registre su huella dactilar.');

    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const supportedAuthTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();

    if (hasHardware && supportedAuthTypes.length > 0) {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Registro de huella dactilar requerido',
        fallbackLabel: 'Intentar de nuevo',
      });

      if (result.success) {
        setIsAuthenticated(true);
        setAuthMessage('Registro exitoso. Bienvenido a la aplicación.');
        speak('Registro exitoso. Bienvenido a la aplicación.');
        showAvailableFeatures();
      } else {
        setFailedAttempts((prev) => prev + 1);
        setAuthMessage('Registro fallido. Inténtalo nuevamente.');
        speak('Registro fallido. Inténtalo nuevamente.');

        if (failedAttempts >= 2) {
          speak(
            'Se ha alcanzado el límite de intentos fallidos. Por favor, intente nuevamente más tarde.'
          );
          setFailedAttempts(0);
        }
      }
    } else {
      setAuthMessage(
        'No se encontró soporte biométrico. No puede usar esta aplicación.'
      );
      speak(
        'No se encontró soporte biométrico en su dispositivo. No puede usar esta aplicación.'
      );
    }
  };

  const showAvailableFeatures = () => {
    speak(
      'Ahora puede usar la aplicación. Las funcionalidades disponibles son: buscar rutas, abrir el GPS, personalizar la aplicación y enviar una emergencia. Diga el nombre de la función que desea usar.'
    );
  };

  const handleEmergency = async () => {
    if (!emergencyContact) {
      Alert.alert('No se configuró un contacto de emergencia');
      speak('Por favor, configure un contacto de emergencia en la sección de personalización.');
      return;
    }

    // Verificar si el contacto tiene WhatsApp
    const url = `whatsapp://send?phone=${emergencyContact}&text=${encodeURIComponent('¡Emergencia! Necesito ayuda.')}`;

    Linking.openURL(url).catch((err) => {
      console.log(err);
      Alert.alert("Error", "No se pudo abrir WhatsApp.");
      speak("No se pudo abrir WhatsApp.");
    });
  };

  return (
    <View style={styles.container}>
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
              onPress={() => setInputVisible(true)}
            >
              <Text style={styles.featureText}>Personalización</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.featureButton}
              onPress={handleEmergency}
            >
              <Text style={styles.featureText}>Emergencia</Text>
            </TouchableOpacity>
          </>
        ) : (
          <Text style={styles.authenticatingText}>{authMessage}</Text>
        )}
      </View>

      {inputVisible && (
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Número de contacto de emergencia:</Text>
          <TextInput
            style={styles.input}
            keyboardType="phone-pad"
            placeholder="Ingrese el número"
            onChangeText={(text) => setEmergencyContact(text)}
          />
          <TouchableOpacity
            style={styles.saveButton}
            onPress={() => {
              setInputVisible(false);
              speak('Número de emergencia configurado con éxito.');
            }}
          >
            <Text style={styles.featureText}>Guardar</Text>
          </TouchableOpacity>
        </View>
      )}
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
  inputContainer: {
    position: 'absolute',
    bottom: 50,
    width: '90%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  inputLabel: {
    fontSize: 16,
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
  },
  saveButton: {
    backgroundColor: '#00897b',
    padding: 10,
    alignItems: 'center',
    borderRadius: 5,
  },
});

export default App;
