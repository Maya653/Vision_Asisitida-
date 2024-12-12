import React, { useState, useEffect, useRef } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Dimensions, TouchableWithoutFeedback } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons'; // Usando íconos de Material Icons
import * as Speech from 'expo-speech'; // Importa expo-speech

const { width } = Dimensions.get('window');

const App = () => {
  const [rutas, setRutas] = useState([]);
  const [horarios, setHorarios] = useState([]);
  const [bases, setBases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(true); // Controla si la voz está activa
  const [showRutas, setShowRutas] = useState(true); // Controla la visibilidad de las rutas
  const flatListRef = useRef(null); // Referencia al FlatList para controlarlo
  const touchTimeoutRef = useRef(null); // Referencia para el temporizador
  const [touchTimeout, setTouchTimeout] = useState(null); // Para manejar el tiempo de espera entre toques

  const fetchData = async () => {
    try {
      const rutasResponse = await fetch('https://r2q7rm7h-8000.usw3.devtunnels.ms/rutas');
      const rutasData = await rutasResponse.json();
      setRutas(rutasData);

      const horariosResponse = await fetch('https://r2q7rm7h-8000.usw3.devtunnels.ms/horarios');
      const horariosData = await horariosResponse.json();
      setHorarios(horariosData);

      const basesResponse = await fetch('https://r2q7rm7h-8000.usw3.devtunnels.ms/bases');
      const basesData = await basesResponse.json();
      setBases(basesData);

      setLoading(false);
    } catch (error) {
      console.error('Error al obtener datos:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (rutas.length > 0 && isSpeaking && showRutas) {
      let index = 0;
      const interval = setInterval(() => {
        if (index === rutas.length - 1) {
          index = 0;
        } else {
          index++;
        }

        flatListRef.current?.scrollToIndex({ index, animated: true });

        // Leer el nombre de la ruta con Expo Speech solo si isSpeaking es verdadero
        if (isSpeaking) {
          const rutaName = rutas[index].nombre;
          Speech.speak(`Ruta: ${rutaName}`); // Hace que lea el nombre de la ruta
        }
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [rutas, isSpeaking, showRutas]);

  // Maneja el primer toque para detener la voz y ocultar rutas
  const handleTouch = () => {
    // Si ya hay un temporizador, cancelarlo para evitar interferencias
    if (touchTimeoutRef.current) {
      clearTimeout(touchTimeoutRef.current);
    }

    // Configuramos un nuevo temporizador para distinguir entre un toque corto o un doble toque
    setTouchTimeout(true); // Marca que el toque ha ocurrido
    touchTimeoutRef.current = setTimeout(() => {
      if (touchTimeout) {
        // Primer toque: detener la voz y ocultar rutas
        if (isSpeaking) {
          Speech.stop();
          setIsSpeaking(false);
        }
        setShowRutas(false);
      } else {
        // Segundo toque: reactivar la voz y mostrar rutas
        setIsSpeaking(true);
        setShowRutas(true);
      }
      // Restablecer el temporizador y el estado de toque
      setTouchTimeout(false);
    }, 300); // Espera de 300ms para detectar el segundo toque

  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  const getHorarioYBase = (rutaId) => {
    const horario = horarios.find(h => h.id_ruta === rutaId);
    const base = bases.find(b => b.id_base === rutaId);
    return { horario, base };
  };

  const renderItem = ({ item }) => {
    const { horario, base } = getHorarioYBase(item.id_ruta);

    return (
      <TouchableWithoutFeedback onPress={handleTouch}>
        <View style={styles.slide}>
          {showRutas && (
            <View style={styles.card}>
              <Text style={styles.title}>{item.nombre}</Text>

              <View style={styles.infoSection}>
                <MaterialIcons name="directions-bus" size={24} color="#000" />
                <Text style={styles.text}>Ruta: {item.id_ruta}</Text>
              </View>

              <View style={styles.infoSection}>
                <MaterialIcons name="place" size={24} color="#000" />
                <Text style={styles.text}>Origen: {item.origen} - Destino: {item.destino}</Text>
              </View>

              {horario && (
                <View style={styles.infoSection}>
                  <MaterialIcons name="schedule" size={24} color="#000" />
                  <Text style={styles.text}>Horario: {horario.hora_salida} - {horario.hora_llegada}</Text>
                </View>
              )}

              {base && (
                <View style={styles.infoSection}>
                  <MaterialIcons name="location-on" size={24} color="#000" />
                  <Text style={styles.text}>Base: {base.nombre_base}</Text>
                </View>
              )}
            </View>
          )}
        </View>
      </TouchableWithoutFeedback>
    );
  };

  return (
    <FlatList
      ref={flatListRef}
      data={rutas}
      renderItem={renderItem}
      keyExtractor={(item) => item.id_ruta.toString()}
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  slide: {
    width: width,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    width: width * 0.8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
  },
  infoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  text: {
    fontSize: 16,
    marginLeft: 10,
  },
});

export default App;
