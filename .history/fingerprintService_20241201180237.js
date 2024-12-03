export const registerFingerprint = async (userId, huellaData) => {
    try {
      const response = await fetch('http://192.168.x.x:3000/api/huellas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, huellaData }),
      });
  
      const data = await response.json();
  
      if (response.ok) {
        console.log("Huella registrada:", data.message);
      } else {
        console.error("Error al registrar huella:", data.message);
      }
    } catch (error) {
      console.error("Error de conexión:", error);
    }
  };
  