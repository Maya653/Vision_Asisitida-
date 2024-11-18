import * as LocalAuthentication from 'expo-local-authentication';
import React, { useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

export default function App() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Maneja la autenticación biométrica
  const handleBiometricAuth = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const supportedAuthTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();

      if (hasHardware && supportedAuthTypes.length > 0) {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Verificar identidad',
          fallbackLabel: 'Usar contraseña',
        });

        if (result.success) {
          setIsAuthenticated(true);
          Alert.alert('Inicio de sesión exitoso', '¡Bienvenido!');
        } else {
          Alert.alert('Error', 'No se pudo autenticar. Intenta de nuevo.');
        }
      } else {
        Alert.alert('Error', 'Tu dispositivo no soporta autenticación biométrica.');
      }
    } catch (error) {
      console.error('Error durante la autenticación:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Visión Asistida</Text>
      <Text style={styles.subtitle}>Inicio de Sesión</Text>

      {!isAuthenticated ? (
        <>
          <TextInput
            style={styles.input}
            placeholder="Usuario"
            placeholderTextColor="#D3D3D3"
            onChangeText={setUsername}
            value={username}
          />
          <TextInput
            style={styles.input}
            placeholder="Contraseña"
            placeholderTextColor="#D3D3D3"
            secureTextEntry
            onChangeText={setPassword}
            value={password}
          />

          <TouchableOpacity style={styles.button} onPress={handleBiometricAuth}>
            <Text style={styles.buttonText}>Iniciar sesión con biometría</Text>
          </TouchableOpacity>
        </>
      ) : (
        <Text style={styles.welcomeText}>¡Bienvenido, {username || 'usuario'}!</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E9EFFB', // Color de fondo similar al diseño proporcionado
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2452A6', // Azul oscuro del diseño
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#2452A6',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#2452A6',
    borderRadius: 10,
    padding: 10,
    fontSize: 16,
    backgroundColor: '#FFFFFF', // Blanco para contraste
    color: '#000000',
    marginBottom: 15,
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#2452A6', // Azul oscuro para botones
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF', // Blanco para el texto del botón
    fontSize: 16,
    fontWeight: 'bold',
  },
  welcomeText: {
    fontSize: 20,
    color: '#2452A6',
    marginTop: 20,
  },
});
