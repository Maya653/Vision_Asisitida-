export const registerFingerprint = async (userId, huellaData) => {
  try {
    const response = await fetch('http://192.168.2.120:3000/api/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, huellaData }),
    });
    
    const textResponse = await response.text(); // Leer la respuesta como texto
    let data;

    try {
      data = JSON.parse(textResponse); // Intentar analizarlo como JSON
    } catch (e) {
      console.error('Error al parsear respuesta JSON:', e);
      throw new Error('Respuesta no es JSON');
    }

    if (response.ok) {
      console.log('Huella registrada:', data.message);
      return { success: true, message: data.message }; // Se agrega retorno de éxito
    } else {
      console.error('Error al registrar huella:', data.message);
      return { success: false, message: data.message }; // Se agrega retorno de error
    }
  } catch (error) {
    console.error('Error de conexión:', error);
    return { success: false, message: 'Error de conexión' }; // Manejo de error de conexión
  }
};
