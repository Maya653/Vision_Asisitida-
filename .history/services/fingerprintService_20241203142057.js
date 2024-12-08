import Constants from 'expo-constants';

const getBackendUrl = () => {
  // Si estás en desarrollo, usa la IP dinámica
  if (Constants.manifest.debuggerHost) {
    const host = Constants.manifest.debuggerHost.split(':').shift(); // Obtener la IP del host
    return `http://${host}:3000/api/register`;
  }
  // Si estás en producción, configura la URL fija
  return 'https://tu-backend-produccion.com/api/register';
};

export const registerFingerprint = async (userId, huellaData) => {
  const backendUrl = getBackendUrl(); // Obtener la URL dinámica o fija
  try {
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, huellaData }),
    });

    const textResponse = await response.text();
    let data;

    try {
      data = JSON.parse(textResponse);
    } catch (e) {
      console.error('Error al parsear respuesta JSON:', e);
      throw new Error('Respuesta no es JSON');
    }

    if (response.ok) {
      console.log('Huella registrada:', data.message);
    } else {
      console.error('Error al registrar huella:', data.message);
    }
  } catch (error) {
    console.error('Error de conexión:', error);
  }
};
