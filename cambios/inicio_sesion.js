import * as LocalAuthentication from 'expo-local-authentication';
import * as Haptics from 'expo-haptics';
import * as SMS from 'expo-sms';
import * as Speech from 'expo-speech';
import React, { useState } from 'react';
import { Button, Text, View, Alert, TextInput, StyleSheet } from 'react-native';

const BiometricLogin = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [emergencyContact, setEmergencyContact] = useState('');
  const [message, setMessage] = useState('¡Emergencia! Necesito ayuda.');
  const [pitch, setPitch] = useState(1); // 1 es tono normal
  const [rate, setRate] = useState(1); // 1 es velocidad normal

  const handleBiometricAuth = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const supportedAuthTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();

      if (hasHardware && supportedAuthTypes.length > 0) {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Iniciar sesión',
          fallbackLabel: 'Usar contraseña',
        });

        if (result.success) {
          setIsAuthenticated(true);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Alert.alert('Autenticación exitosa');
        } else {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          Alert.alert('Autenticación fallida', 'Inténtalo nuevamente');
        }
      } else {
        Alert.alert('No se encontró soporte biométrico en tu dispositivo');
      }
    } catch (error) {
      Alert.alert('Error', 'Ocurrió un problema con la autenticación biométrica');
    }
  };

  const handleEmergency = async () => {
    if (!emergencyContact) {
      Alert.alert('Error', 'Por favor, ingrese un número de emergencia');
      return;
    }

    try {
      const { result } = await SMS.sendSMSAsync(
        [emergencyContact],
        message
      );

      if (result === 'sent') {
        Alert.alert('Mensaje de emergencia enviado');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Alert.alert('Error', 'No se pudo enviar el mensaje de emergencia');
      }
    } catch (error) {
      Alert.alert('Error', 'Ocurrió un problema al enviar el mensaje');
    }
  };

  const handleVoiceSettings = (command) => {
    if (command.includes('agudo')) {
      setPitch(1.5); // Más agudo
      Speech.speak('La voz ahora es más aguda.', { pitch: 1.5, rate });
    } else if (command.includes('grave')) {
      setPitch(0.5); // Más grave
      Speech.speak('La voz ahora es más grave.', { pitch: 0.5, rate });
    } else if (command.includes('rápido')) {
      setRate(1.5); // Más rápido
      Speech.speak('La voz ahora es más rápida.', { pitch, rate: 1.5 });
    } else if (command.includes('lento')) {
      setRate(0.5); // Más lento
      Speech.speak('La voz ahora es más lenta.', { pitch, rate: 0.5 });
    } else {
      Speech.speak('No entendí el comando. Intente de nuevo.', { pitch, rate });
    }
  };

  return (
    <View style={styles.container}>
      <Button title="Iniciar sesión con biometría" onPress={handleBiometricAuth} />

      {isAuthenticated && (
        <View style={styles.settingsContainer}>
          <Text style={styles.text}>Configuración de voz:</Text>
          <TextInput
            style={styles.input}
            placeholder="Diga 'agudo', 'grave', 'rápido' o 'lento'"
            onSubmitEditing={(e) => handleVoiceSettings(e.nativeEvent.text)}
          />
          <Text style={styles.text}>Número de contacto de emergencia:</Text>
          <TextInput
            style={styles.input}
            placeholder="Ingrese el número"
            keyboardType="phone-pad"
            value={emergencyContact}
            onChangeText={setEmergencyContact}
          />
          <Button title="Enviar mensaje de emergencia" onPress={handleEmergency} />
        </View>
      )}

      {isAuthenticated && <Text style={styles.welcomeText}>¡Bienvenido!</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f0f4f7',
  },
  welcomeText: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  settingsContainer: {
    marginTop: 20,
    width: '90%',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.5,
    elevation: 5,
  },
  text: {
    fontSize: 16,
    marginBottom: 10,
  },
  input: {
    width: '100%',
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginBottom: 15,
  },
});

export default BiometricLogin;
