// Firebase Error Code Translator
// Convierte códigos técnicos de Firebase en mensajes amigables en español

export function translateFirebaseError(error: any): string {
  const errorMessage = error?.message || '';
  const errorCode = error?.code || '';

  // Extraer el código de Firebase si está en el mensaje
  const firebaseCodeMatch = errorMessage.match(/\(auth\/([^)]+)\)/);
  const code = firebaseCodeMatch ? firebaseCodeMatch[1] : errorCode;

  const errorTranslations: Record<string, string> = {
    // Errores de registro
    'email-already-in-use': 'Este correo electrónico ya está registrado. Intenta con otro correo o inicia sesión.',
    'weak-password': 'La contraseña es demasiado débil. Usa al menos 6 caracteres con letras y números.',
    'invalid-email': 'El correo electrónico no es válido.',
    'operation-not-allowed': 'El registro está deshabilitado temporalmente. Intenta más tarde.',
    'too-many-requests': 'Has intentado demasiadas veces. Espera unos minutos e intenta de nuevo.',
    'email-not-verified': 'Tu correo aún no ha sido verificado. Revisa tu bandeja de entrada y confirma tu cuenta.',

    // Errores de inicio de sesión
    'user-not-found': 'No existe cuenta con este correo. Verifica que escribiste bien tu correo o regístrate.',
    'wrong-password': 'Contraseña incorrecta. Intenta de nuevo o usa "Recuperar contraseña".',
    'invalid-credential': 'Las credenciales no son válidas. Verifica tu correo y contraseña.',
    'user-disabled': 'Esta cuenta ha sido deshabilitada. Contacta con soporte.',

    // Errores generales
    'network-request-failed': 'Error de conexión. Verifica tu internet e intenta de nuevo.',
    'internal-error': 'Error interno del servidor. Intenta de nuevo más tarde.',
    'timeout': 'La solicitud tardó demasiado tiempo. Intenta de nuevo.',
  };

  // Si encontramos una traducción, la retornamos
  if (code && errorTranslations[code]) {
    return errorTranslations[code];
  }

  // Búsqueda parcial en el mensaje
  for (const [key, value] of Object.entries(errorTranslations)) {
    if (errorMessage.toLowerCase().includes(key)) {
      return value;
    }
  }

  // Fallback: mostrar un mensaje genérico sin exponer el código
  if (errorMessage.includes('Firebase')) {
    return 'Ocurrió un error al procesar tu solicitud. Intenta de nuevo.';
  }

  return errorMessage || 'Ocurrió un error inesperado. Intenta de nuevo.';
}
