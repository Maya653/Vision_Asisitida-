import Voice from '@react-native-voice/voice'; // Reconocimiento de voz
import { useKeepAwake } from 'expo-keep-awake'; // Mantener la pantalla encendida
import * as Speech from 'expo-speech';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableWithoutFeedback, View } from 'react-native';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [tapCount, setTapCount] = useState(0); // Contador de toques
  const [assistantActive, setAssistantActive] = useState(false); // Estado del asistente de voz
  const [recognizedText, setRecognizedText] = useState(''); // Texto reconocido por el asistente
  const [lastTap, setLastTap] = useState(0); // Último toque registrado
  const [timeoutId, setTimeoutId] = useState(null); // ID del temporizador

  // Mantener la pantalla activa
  useKeepAwake();

  // Función para hablar
  const speak = (message) => {
    console.log('Hablando:', message);
    Speech.speak(message, {
      language: 'es-ES',
      pitch: 1,
      rate: 1,
    });
  };

  // Función para iniciar el asistente de voz
  const startVoiceAssistant = () => {
    setAssistantActive(true);
    speak('Asistente activado. Por favor, di un comando.');
    try {
      Voice.start('es-ES'); // Iniciar reconocimiento en español
    } catch (error) {
      console.error('Error al iniciar el reconocimiento de voz:', error);
    }
  };

  // Configurar el reconocimiento de voz
  useEffect(() => {
    Voice.onSpeechResults = (event) => {
      const text = event.value[0];
      console.log('Texto reconocido:', text);
      setRecognizedText(text);
      processCommand(text); // Procesar el comando reconocido
    };

    Voice.onSpeechError = (error) => {
      console.error('Error en el reconocimiento de voz:', error);
    };

    return () => {
      Voice.destroy().then(Voice.removeAllListeners); // Limpiar al desmontar
    };
  }, []);

  // Procesar comandos de voz
  const processCommand = (command) => {
    if (command.includes('activar GPS')) {
      speak('Activando GPS...');
      // Lógica para activar GPS aquí
    } else if (command.includes('buscar rutas')) {
      speak('Buscando rutas...');
      // Lógica para buscar rutas aquí
    } else {
      speak('Comando no reconocido. Por favor, intenta de nuevo.');
    }
    setAssistantActive(false); // Desactivar asistente tras procesar
  };

  // Manejo de toques en pantalla
  const handleTap = (e) => {
    const now = Date.now();
    const touchY = e.nativeEvent.pageY; // Coordenada Y del toque
    const isTopArea = touchY < 500; // Área superior (ajustar según pantalla)

    // Lógica para contar toques
    if (tapCount === 0 || now - lastTap > 600) {
      setTapCount(1);
      clearTimeout(timeoutId);
    } else if (tapCount === 1 && now - lastTap < 600) {
      setTapCount(2);
      clearTimeout(timeoutId);
    }
    setLastTap(now);

    const newTimeoutId = setTimeout(() => {
      setTapCount(0); // Reiniciar el contador después de un intervalo largo
    }, 1000);
    setTimeoutId(newTimeoutId);

    // Procesar acción basada en la ubicación del toque
    if (tapCount === 2 && isTopArea && isAuthenticated) {
      speak('Activando GPS...');
      startVoiceAssistant(); // Activar asistente de voz
      setTapCount(0); // Reiniciar contador después de la acción
    }
  };

  useEffect(() => {
    speak('Hola, soy tu app de visión asistida. Toca dos veces la parte superior para activar el GPS o usar el asistente de voz.');
  }, []);

  return (
    <TouchableWithoutFeedback onPress={handleTap}>
      <View style={styles.container}>
        {!isAuthenticated ? (
          <View style={styles.card}>
            <Text style={styles.welcomeText}>¡Bienvenido!</Text>
            <Text style={styles.instructions}>
              Toca dos veces la parte superior para autenticarte.
            </Text>
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.welcomeText}>Inicio de sesión exitoso</Text>
            <Text style={styles.instructions}>
              Toca dos veces la parte superior para usar el asistente de voz.
            </Text>
            {assistantActive && (
              <View>
                <Text style={styles.voiceText}>Escuchando...</Text>
                <Text style={styles.recognizedText}>{recognizedText}</Text>
              </View>
            )}
          </View>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  card: {
    padding: 20,
    margin: 20,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  instructions: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
  voiceText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    color: '#000',
  },
  recognizedText: {
    fontSize: 16,
    color: '#444',
    marginTop: 10,
  },
});

export default App;
