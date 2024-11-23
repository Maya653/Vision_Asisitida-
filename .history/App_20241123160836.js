import * as LocalAuthentication from 'expo-local-authentication';
import * as Speech from 'expo-speech';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Función para capturar huella
  const registerFingerprint = async (usuario_id) => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Por favor, registre su huella dactilar',
        fallbackLabel: 'Usar contraseña',
      });

      if (result.success) {
        const response = await sendFingerprintToServer(usuario_id, result); // Llamar al servidor
        if (response.success) {
          setIsAuthenticated(true);
          Speech.speak("Huella registrada exitosamente.");
        } else {
          Alert.alert("Error", response.message);
        }
      } else {
        Alert.alert("Registro fallido", "No se pudo registrar la huella.");
      }
    } catch (error) {
      Alert.alert("Error", "Hubo un problema al registrar la huella.");
    }
  };

  // Función para enviar la huella al servidor
  const sendFingerprintToServer = async (usuario_id, fingerprintData) => {
    try {
      const response = await fetch('http://<IP_DEL_SERVIDOR>/autenticacion_huella.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          usuario_id: usuario_id,
          huella: fingerprintData, // Enviar la huella como Base64
        }),
      });
      return await response.json();
    } catch (error) {
      console.error("Error al enviar la huella:", error);
      return { success: false, message: "No se pudo conectar al servidor." };
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Registro de Huella</Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => registerFingerprint(1)} // Cambia el ID del usuario según corresponda
      >
        <Text style={styles.buttonText}>Registrar Huella</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
  },
  button: {
    padding: 10,
    backgroundColor: 'blue',
    borderRadius: 5,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
  },
});

export default App;
