from fastapi import FastAPI, HTTPException
import mysql.connector
from mysql.connector import Error
from fastapi.middleware.cors import CORSMiddleware
import time
from datetime import timedelta, datetime

# Configuración de la base de datos
DB_CONFIG = {
    'host': '127.0.0.1',
    'port': 3306,
    'user': 'root',
    'password': '1234',
    'database': 'transport_db'
}

# Función para conectar a la base de datos
def get_connection():
    try:
        connection = mysql.connector.connect(**DB_CONFIG)
        return connection
    except Error as e:
        print(f"Error al conectar a la base de datos: {e}")
        raise HTTPException(status_code=500, detail="Error al conectar a la base de datos")

# Función para convertir segundos a formato HH:mm:ss
def segundos_a_hora(segundos):
    if isinstance(segundos, timedelta):
        segundos = segundos.total_seconds()
    return time.strftime('%H:%M:%S', time.gmtime(segundos))

# Función para convertir formato de 24 horas a 12 horas con AM/PM
def convertir_a_ampm(hora24):
    try:
        hora = datetime.strptime(hora24, "%H:%M:%S")  # Convierte a objeto datetime
        return hora.strftime("%I:%M %p")  # Devuelve en formato 12 horas con AM/PM
    except ValueError:
        return hora24  # Si no es un formato válido, devuelve el original


# Inicialización de la aplicación FastAPI
app = FastAPI()

# Configuración de CORS para permitir solicitudes desde cualquier origen
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permitir solicitudes desde cualquier origen
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],  # Métodos permitidos
    allow_headers=["*"],  # Encabezados permitidos
)

# Endpoint para obtener todas las rutas
@app.get("/rutas")
def get_rutas():
    connection = get_connection()
    cursor = connection.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM rutas")
        rutas = cursor.fetchall()
        if not rutas:
            raise HTTPException(status_code=404, detail="No se encontraron rutas")
        return rutas
    except Error as e:
        print(f"Error al obtener rutas: {e}")
        raise HTTPException(status_code=500, detail="Error al obtener rutas")
    finally:
        cursor.close()
        connection.close()

# Endpoint para obtener los horarios
@app.get("/horarios")
def get_horarios():
    connection = get_connection()
    cursor = connection.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM horarios")
        horarios = cursor.fetchall()
        if not horarios:
            raise HTTPException(status_code=404, detail="No se encontraron horarios")
        return horarios
    except Error as e:
        print(f"Error al obtener horarios: {e}")
        raise HTTPException(status_code=500, detail="Error al obtener horarios")
    finally:
        cursor.close()
        connection.close()

# Endpoint para obtener las bases
@app.get("/bases")
def get_bases():
    connection = get_connection()
    cursor = connection.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM bases")
        bases = cursor.fetchall()
        if not bases:
            raise HTTPException(status_code=404, detail="No se encontraron bases")
        return bases
    except Error as e:
        print(f"Error al obtener bases: {e}")
        raise HTTPException(status_code=500, detail="Error al obtener bases")
    finally:
        cursor.close()
        connection.close()

# Endpoint para obtener las bases asociadas a una ruta
@app.get("/base-info/{id_base}")
def get_base_info(id_base: int):
    connection = get_connection()
    cursor = connection.cursor(dictionary=True)
    try:
        query = """
            SELECT b.id_base, b.nombre_base, b.latitud, b.longitud,
                   h.hora_salida, h.hora_llegada, h.duracion
            FROM bases b
            LEFT JOIN ruta_base rb ON b.id_base = rb.id_base
            LEFT JOIN horarios h ON rb.id_ruta = h.id_ruta
            WHERE b.id_base = %s
        """
        cursor.execute(query, (id_base,))
        base = cursor.fetchone()  # Obtiene el primer registro
        if not base:
            raise HTTPException(status_code=404, detail="Base no encontrada")
        
        # Convertir las horas a formato HH:mm:ss
        if 'hora_salida' in base:
            base['hora_salida'] = segundos_a_hora(base['hora_salida'])
        if 'hora_llegada' in base:
            base['hora_llegada'] = segundos_a_hora(base['hora_llegada'])

        # Leer todos los resultados restantes (en caso de que haya más)
        cursor.fetchall()  # Esto garantiza que no haya resultados pendientes

        return base
    except Error as e:
        print(f"Error al obtener la base: {e}")
        raise HTTPException(status_code=500, detail="Error al obtener la base")
    finally:
        cursor.close()  # Cierra el cursor
        connection.close()  # Cierra la conexión

# Endpoint para obtener los horarios de una ruta específica
@app.get("/rutas/{id_ruta}/horarios")
def get_horarios_por_ruta(id_ruta: int):
    connection = get_connection()
    cursor = connection.cursor(dictionary=True)
    try:
        query = """
            SELECT h.id_horario, h.hora_salida, h.hora_llegada, r.nombre AS ruta_nombre, 
                   b.nombre_base, b.latitud, b.longitud, h.duracion
            FROM horarios h
            JOIN rutas r ON h.id_ruta = r.id_ruta
            JOIN ruta_base rb ON r.id_ruta = rb.id_ruta
            JOIN bases b ON rb.id_base = b.id_base
            WHERE r.id_ruta = %s
        """
        cursor.execute(query, (id_ruta,))
        horarios = cursor.fetchall()
        if not horarios:
            raise HTTPException(status_code=404, detail="No se encontraron horarios para esta ruta")
        
        # Convertir las horas de segundos a formato HH:mm:ss
        for horario in horarios:
            horario['hora_salida'] = segundos_a_hora(horario['hora_salida'])
            horario['hora_llegada'] = segundos_a_hora(horario['hora_llegada'])

        return horarios
    except Error as e:
        print(f"Error al obtener los horarios de la ruta: {e}")
        raise HTTPException(status_code=500, detail="Error al obtener horarios para esta ruta")
    finally:
        cursor.close()
        connection.close()
