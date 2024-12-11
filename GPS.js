import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import * as Speech from 'expo-speech';
import axios from 'axios';

// Clave de API de Google Maps
const GOOGLE_API_KEY = 'AIzaSyCWl08uMleQW06aQnzqfKerAoJVVwhqb4E'; // Reemplaza con tu clave
const SERVER_URL = 'http://192.168.1.36:8000'; //  IP de mi  servidor

const GPS = () => {
  const [location, setLocation] = useState(null);
  const [destination, setDestination] = useState(null);
  const [route, setRoute] = useState([]);
  const [bases, setBases] = useState([]);
  const [loading, setLoading] = useState(false);

  // Función para decodificar la polilínea de Google Maps
  const decodePolyline = (encoded) => {
    let points = [];
    let index = 0;
    let lat = 0;
    let lng = 0;

    while (index < encoded.length) {
      let byte, shift = 0, result = 0;
      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);
      let dlat = (result & 1) ? ~(result >> 1) : (result >> 1);
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);
      let dlng = (result & 1) ? ~(result >> 1) : (result >> 1);
      lng += dlng;

      points.push({ latitude: lat / 1E5, longitude: lng / 1E5 });
    }

    return points;
  };

  // Obtener ubicación actual y permisos
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Se requiere acceso a la ubicación.');
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    })();
  }, []);

  // Cargar bases desde el servidor
  useEffect(() => {
    const fetchBases = async () => {
      try {
        const response = await axios.get(`${SERVER_URL}/bases`);
        setBases(response.data);
      } catch (error) {
        Alert.alert('Error', 'No se pudieron cargar las bases.');
      }
    };

    fetchBases();
  }, []);

  // Emitir mensajes de voz
  const speak = (message) => {
    Speech.speak(message, { language: 'es-MX', pitch: 1, rate: 1 });
  };

  // Obtener hora actual y anunciarla
  const announceCurrentTime = () => {
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const period = hours >= 12 ? 'PM' : 'AM';

    if (hours > 12) {
      hours -= 12;
    } else if (hours === 0) {
      hours = 12;
    }

    const currentTime = `${hours}:${minutes} ${period}`;
    speak(`La hora actual es ${currentTime}`);
  };
  // Obtener la base más cercana
  const findClosestBase = () => {
    if (!location) {
      speak('No se pudo obtener tu ubicación actual.');
      return null;
    }

    let closestBase = null;
    let shortestDistance = Infinity;

    bases.forEach((base) => {
      const distance = getDistance(
        location.latitude,
        location.longitude,
        base.latitud,
        base.longitud
      );

      if (distance < shortestDistance) {
        shortestDistance = distance;
        closestBase = base;
      }
    });

    return closestBase;
  };

  // Calcular distancia entre dos puntos (haversine)
  const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Radio de la Tierra en metros
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // En metros
  };

  const calculateWalkingTime = async (closestBase) => {
    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/directions/json`,
        {
          params: {
            origin: `${location.latitude},${location.longitude}`,
            destination: `${closestBase.latitud},${closestBase.longitud}`,
            mode: 'walking',
            key: GOOGLE_API_KEY,
          },
        }
      );

      if (
        response.data.routes &&
        response.data.routes.length > 0 &&
        response.data.routes[0].legs &&
        response.data.routes[0].legs.length > 0
      ) {
        const walkingTime = response.data.routes[0].legs[0].duration.text.replace('min', 'minutos');
        speak(
          `El tiempo estimado para llegar a la base más cercana caminando es de ${walkingTime}.`
        );
        
      } else {
        speak('No se pudo calcular el tiempo de traslado.');
      }
    } catch (error) {
      console.error(error);
      speak('Hubo un error al calcular el tiempo de traslado.');
    }
  };

  const selectClosestRoute = async () => {
    if (loading) return;

    setLoading(true);
    const closestBase = findClosestBase();
    if (!closestBase) {
      speak('No se pudo encontrar la base más cercana.');
      setLoading(false);
      return;
    }

    await calculateWalkingTime(closestBase);
    setLoading(false);
  

    const baseInfo = await getBaseInfo(closestBase.id_base);

    if (baseInfo) {
      setDestination({
        latitude: closestBase.latitud,
        longitude: closestBase.longitud,
      });
    
  // Convertir el horario de salida al formato AM/PM
  const horarioSalida24h = baseInfo.hora_salida; // Asumimos que es una cadena como "13:30"
  const [hora, minutos] = horarioSalida24h.split(':').map(Number);
  const periodo = hora >= 12 ? 'PM' : 'AM';
  const hora12h = hora % 12 === 0 ? 12 : hora % 12; // Convertir a formato 12 horas

  speak(
    `La base más cercana es ${closestBase.nombre_base}. El próximo horario de salida es a las ${hora12h}:${minutos
      .toString()
      .padStart(2, '0')} ${periodo}. La duración estimada del viaje es de ${baseInfo.duracion} minutos.`
  );

  await fetchDirections();
} else {
  speak('No se pudo obtener información adicional de la base.');
}

setLoading(false);
};

  // Obtener información de la base desde el servidor
  const getBaseInfo = async (baseId) => {
    try {
      const response = await axios.get(`${SERVER_URL}/base-info/${baseId}`);
      console.log('Respuesta de la base:', response.data);  // Agregar más detalles de la respuesta
      
      // Comprobamos que `duracion` y `hora_salida` estén en la respuesta
      if (response.data && response.data.duracion && response.data.hora_salida) {
        return response.data;  // Devuelve los datos correctamente
      } else {
        console.error('Datos de horario o duración no encontrados en la respuesta:', response.data);
        return null;  // Retorna null si no se encuentran los datos
      }
    } catch (error) {
      console.error('Error al obtener la información de la base:', error);
      return null;  // Maneja el error si la solicitud falla
    }
  };
  

  // Obtener direcciones
  const fetchDirections = async () => {
    if (!destination) {
      Alert.alert('Error', 'Selecciona un destino antes de navegar.');
      return;
    }

    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/directions/json`,
        {
          params: {
            origin: `${location.latitude},${location.longitude}`,
            destination: `${destination.latitude},${destination.longitude}`,
            mode: 'walking',
            key: GOOGLE_API_KEY,
          },
        }
      );

      if (response.data.routes && response.data.routes.length > 0) {
        const points = decodePolyline(response.data.routes[0].overview_polyline.points);
        setRoute(points);
        speak('Ruta calculada exitosamente. Puedes comenzar tu viaje.');
      } else {
        Alert.alert('Error', 'No se pudo calcular la ruta.');
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudieron obtener las direcciones.');
    }
  };

  return (
    <View style={styles.container}>
      {location && (
        <MapView style={styles.map} initialRegion={location} showsUserLocation={true}>
          {bases.map((base) => (
            <Marker
              key={base.id_base}
              coordinate={{ latitude: base.latitud, longitude: base.longitud }}
              title={base.nombre_base}
            />
          ))}
          {route.length > 0 && <Polyline coordinates={route} strokeWidth={4} strokeColor="blue" />}
        </MapView>
      )}

      {loading && <ActivityIndicator size="large" color="#0000ff" />}

      <TouchableOpacity style={styles.button} onPress={() => {
        announceCurrentTime();
        selectClosestRoute();
      }}>
        <Text style={styles.buttonText}>Seleccionar Ruta</Text>
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
  map: {
    width: '100%',
    height: '100%',
  },
  button: {
    backgroundColor: 'blue',
    padding: 10,
    borderRadius: 5,
    marginTop: -60,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
  },
});

export default GPS;
