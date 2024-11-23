import * as LocalAuthentication from 'expo-local-authentication';
import * as Speech from 'expo-speech';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Función para capturar huella
  const registerFingerprint = async (usuario_id) => {
    try {
      // Guía por voz para el usuario
      Speech.speak('Por favor, registre su huella dactilar.');

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Por favor, registre su huella dactilar',
        fallbackLabel: 'Usar contraseña',
      });

      if (result.success) {
        Speech.speak('Huella registrada exitosamente. Ahora puede acceder a las opciones.');
        const response = await sendFingerprintToServer(usuario_id, result); // Llamar al servidor
        if (response.success) {
          setIsAuthenticated(true);
          showAppOptions(); // Mostrar las opciones de la app
        } else {
          Speech.speak('Error al registrar la huella. Intente nuevamente.');
          Alert.alert("Error", response.message);
        }
      } else {
        Speech.speak('No se pudo registrar la huella. Por favor, intente nuevamente.');
        Alert.alert("Registro fallido", "No se pudo registrar la huella.");
      }
    } catch (error) {
      Speech.speak('Hubo un problema al registrar la huella. Por favor, contacte soporte.');
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

  // Función para mostrar opciones de la app
  const showAppOptions = () => {
    Speech.speak('Bienvenido a la aplicación. Por favor, elija una opción.');
    Alert.alert(
      "Opciones",
      "Seleccione lo que desea hacer:",
      [
        {
          text: "Ver Perfil",
          onPress: () => Speech.speak('Accediendo a su perfil.'),
        },
        {
          text: "Realizar Tareas",
          onPress: () => Speech.speak('Redirigiendo a las tareas disponibles.'),
        },
        {
          text: "Salir",
          onPress: () => Speech.speak('Saliendo de la aplicación.'),
        },
      ],
      { cancelable: false }
    );
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
