import * as LocalAuthentication from 'expo-local-authentication';
import React, { useState } from 'react';
import { Button, Text, View, Alert } from 'react-native';

const BiometricLogin = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleBiometricAuth = async () => {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const supportedAuthTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();

    if (hasHardware && supportedAuthTypes.length > 0) {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Iniciar sesión',
        fallbackLabel: 'Usar contraseña',
      });

      if (result.success) {
        setIsAuthenticated(true);
        Alert.alert('Autenticación exitosa');
      } else {
        Alert.alert('Autenticación fallida', 'Inténtalo nuevamente');
      }
    } else {
      Alert.alert('No se encontró soporte biométrico');
    }
  };

  return (
    <View>
      <Button title="Iniciar sesión con biometría" onPress={handleBiometricAuth} />
      {isAuthenticated && <Text>¡Bienvenido!</Text>}
    </View>
  );
};

export default BiometricLogin;
