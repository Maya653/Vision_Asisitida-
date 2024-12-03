import * as LocalAuthentication from 'expo-local-authentication';
import * as Location from 'expo-location';
import * as SMS from 'expo-sms';
import * as Speech from 'expo-speech';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableWithoutFeedback, View } from 'react-native';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [tapCount, setTapCount] = useState(0);
  const [userId] = useState(Math.floor(Math.random() * 10000));
  const [timeoutId, setTimeoutId] = useState(null);
  const [lastTap, setLastTap] = useState(0);
  const [lastVolumePressTime, setLastVolumePressTime] = useState(0);
  const [volumePressCount, setVolumePressCount] = useState(0);
  const [location, setLocation] = useState(null);
  const [destination, setDestination] = useState(null);  // Añadido para la ubicación de destino

  const speak = (message) => {
    Speech.speak(message, { language: 'es-ES', rate: 0.9 });  // Ajustar la velocidad de la voz
  };

  // Función de guía para el usuario al iniciar
  const guideUser = () => {
    speak('Hola, soy tu app de visión asistida. Toca dos veces la parte superior para autenticarte o la parte inferior para registrar una nueva huella.');
  };

  // Función para obtener la ubicación del usuario
  const getLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      speak('Permiso para acceder a la ubicación denegado');
      return;
    }

    const location = await Location.getCurrentPositionAsync({});
    setLocation(location);
    console.log(`Ubicación: Latitud ${location.coords.latitude}, Longitud ${location.coords.longitude}`); // Muestra en la terminal
  };

  // Función para obtener coordenadas usando la API de Mapbox
  const getCoordinates = async (address) => {
    const apiKey = 'pk.eyJ1IjoiZGFuYWU0IiwiYSI6ImNtNDg0NjFydDBjZzEya29ud3gyMTNiaTcifQ.qhyiG54EaODv0PtXoo7N3Q'; // Tu API Key de Mapbox
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${apiKey}`;

    try {
      const response = await fetch(url);
      const data = await response.json();
      if (data.features.length > 0) {
        return data.features[0].geometry.coordinates;
      } else {
        speak('No se pudo encontrar la dirección.');
        return null;
      }
    } catch (error) {
      console.error('Error al obtener las coordenadas:', error);
      speak('Hubo un error al obtener las coordenadas.');
      return null;
    }
  };

  // Establecer la ubicación de inicio y destino
  const setInitialAndDestinationLocations = async () => {
    const startAddress = 'Av. universidad, ampliacion rojo gomez, Tulancingo';
    const destinationAddress = 'Universidad Tecnologica de Tulancingo';

    const startCoordinates = await getCoordinates(startAddress);
    const destinationCoordinates = await getCoordinates(destinationAddress);

    if (startCoordinates && destinationCoordinates) {
      setLocation({ coords: { latitude: startCoordinates[1], longitude: startCoordinates[0] } });
      setDestination({ latitude: destinationCoordinates[1], longitude: destinationCoordinates[0] });
      speak('Las ubicaciones se han establecido.');
    }
  };

  // Función para obtener rutas utilizando la API de Mapbox
  const getRoutesWithMapbox = async () => {
    if (!location || !destination) {
      speak('No se ha definido una ubicación de destino o no se ha obtenido tu ubicación.');
      return;
    }

    const apiKey = 'pk.eyJ1IjoiZGFuYWU0IiwiYSI6ImNtNDg0NjFydDBjZzEya29ud3gyMTNiaTcifQ.qhyiG54EaODv0PtXoo7N3Q'; // Tu API Key de Mapbox
    const origin = `${location.coords.longitude},${location.coords.latitude}`; // Ubicación actual (formato long, lat)
    const destinationLocation = `${destination.longitude},${destination.latitude}`; // Ubicación destino
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${origin};${destinationLocation}?access_token=${apiKey}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data.routes.length > 0) {
        const route = data.routes[0];
        const routeDescription = route.legs[0].steps.map(step => step.maneuver.instruction).join(', ');
        speak(`Las rutas disponibles son: ${routeDescription}`);
      } else {
        speak('No se pudieron encontrar rutas.');
      }
    } catch (error) {
      console.error('Error al buscar rutas:', error);
      speak('Hubo un error al buscar rutas.');
    }
  };

  // Función para enviar un mensaje de emergencia por SMS
  const sendEmergencySMS = async () => {
    if (!location) {
      speak('No se pudo obtener la ubicación.');
      return;
    }

    const { result } = await SMS.sendSMSAsync(
      ['+1234567890'], // Número de contacto (puedes usar el número de emergencia o un contacto guardado)
      `¡Emergencia! Estoy en la ubicación: ${location.coords.latitude}, ${location.coords.longitude}`
    );

    if (result === 'sent') {
      speak('Mensaje de emergencia enviado');
    } else {
      speak('Hubo un error al enviar el mensaje de emergencia');
    }
  };

  // Función para manejar el doble toque en los botones de volumen
  const handleVolumeButtonPress = () => {
    const now = Date.now();
    if (now - lastVolumePressTime < 600) {
      setVolumePressCount(volumePressCount + 1);
    } else {
      setVolumePressCount(1);
    }
    setLastVolumePressTime(now);

    if (volumePressCount === 2) {
      sendEmergencySMS();
    }
  };

  // Función para manejar la autenticación del usuario
  const authenticateUser = async () => {
    speak('Coloca tu dedo en el sensor para autenticarte.');
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    if (hasHardware) {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Autenticación biométrica',
      });

      if (result.success) {
        speak('Autenticación exitosa. Bienvenido.');
        setIsAuthenticated(true);
        speak('Las funcionalidades son las siguientes: 1. Acceder a GPS 2. Buscar rutas 3. Emergencia');
      } else {
        speak('Autenticación fallida. Intenta de nuevo.');
      }
    }
  };

  // Función para manejar el toque en la pantalla (toque superior para autenticación, toque inferior para huella)
  const handleTap = (e) => {
    if (isAuthenticated) return;

    const now = Date.now();
    const touchY = e.nativeEvent.pageY;
    const isTopArea = touchY < 200;
    const isBottomArea = touchY > 500;

    if (tapCount === 0 || now - lastTap > 600) {
      setTapCount(1);
      clearTimeout(timeoutId);
    } else if (tapCount === 1 && now - lastTap < 600) {
      setTapCount(2);
      clearTimeout(timeoutId);
    }
    setLastTap(now);

    const newTimeoutId = setTimeout(() => {
      setTapCount(0);
    }, 1000);
    setTimeoutId(newTimeoutId);

    if (tapCount === 2) {
      if (isTopArea) {
        authenticateUser();
      } else if (isBottomArea) {
        handleFingerprintRegistration();
        getLocation(); // Obtener la ubicación después de la autenticación
      }
      setTapCount(0);
    }
  };

  // Función para registrar huella dactilar
  const handleFingerprintRegistration = async () => {
    speak('Registrando huella dactilar...');
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Por favor coloca tu dedo en el sensor para registrar la huella.',
      cancelLabel: 'Cancelar',
    });

    if (result.success) {
      speak('Huella registrada exitosamente.');
    } else {
      speak('No se pudo registrar la huella. Intenta nuevamente.');
    }
  };

  useEffect(() => {
    guideUser();
    setInitialAndDestinationLocations(); // Configurar las ubicaciones iniciales y destino
  }, []);

  return (
    <View style={styles.container}>
      <TouchableWithoutFeedback onPress={(e) => handleTap(e)}>
        <View style={styles.touchableArea}>
          <Text style={styles.text}>¡Toque en la pantalla para interactuar!</Text>
        </View>
      </TouchableWithoutFeedback>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  touchableArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  text: {
    fontSize: 20,
    textAlign: 'center',
  },
});

export default App;
