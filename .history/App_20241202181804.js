import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';

const App = () => {
  const [touchCount, setTouchCount] = useState(0);
  const [touching, setTouching] = useState(false);
  const [message, setMessage] = useState("Hablando: Hola, soy tu app de visión asistida. Toca dos veces la pantalla para autenticarte o tres veces para registrar una nueva huella.");

  // Temporizador para resetear los toques después de un retraso
  useEffect(() => {
    if (touchCount > 0) {
      const timer = setTimeout(() => {
        setTouchCount(0);  // Resetear contador después de 500ms
      }, 500);  // Reducir el tiempo de espera para detectar un toque triple
      return () => clearTimeout(timer);  // Limpiar el temporizador en el siguiente renderizado
    }
  }, [touchCount]);

  const handleTouch = () => {
    setTouchCount(prevCount => prevCount + 1);  // Aumentar el contador de toques

    if (touchCount === 1) {
      // Detecta el doble toque
      setMessage("Hablando: Coloca tu dedo en el sensor para autenticarte.");
      console.log("Doble toque detectado.");
      // Aquí agregarías la lógica para la autenticación biométrica
    } else if (touchCount === 2) {
      // Detecta el triple toque
      setMessage("Hablando: Registra tu huella tocando el sensor.");
      console.log("Triple toque detectado.");
      // Aquí agregarías la lógica para registrar la huella
    }
  };

  const handleEmergency = () => {
    console.log("Alerta de emergencia activada.");
    // Aquí agregarías la lógica para la emergencia
  };

  return (
    <TouchableWithoutFeedback onPress={handleTouch}>
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.welcomeText}>Vision Asistida</Text>
          <Text style={styles.instructions}>{message}</Text>

          <TouchableOpacity style={styles.emergencyButton} onPress={handleEmergency}>
            <Text style={styles.emergencyText}>Alerta de emergencia</Text>
          </TouchableOpacity>
        </View>
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
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  instructions: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 20,
  },
  emergencyButton: {
    backgroundColor: '#f44336',
    padding: 10,
    borderRadius: 5,
  },
  emergencyText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
  },
});

export default App;
