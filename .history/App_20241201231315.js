import { PermissionsAndroid } from 'react-native';

const requestMicrophonePermission = async () => {
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      {
        title: 'Permiso para grabar audio',
        message: 'Esta aplicación necesita acceso al micrófono para usar comandos de voz.',
        buttonNeutral: 'Preguntar luego',
        buttonNegative: 'Cancelar',
        buttonPositive: 'Aceptar',
      }
    );
    if (granted === PermissionsAndroid.RESULTS.GRANTED) {
      console.log('Permiso de micrófono concedido');
    } else {
      console.log('Permiso de micrófono denegado');
    }
  } catch (err) {
    console.warn(err);
  }
};
