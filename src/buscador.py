import os
import sys

def buscar_palabra(directorio, palabra_buscada):
    # Recorrer todos los archivos y carpetas dentro del directorio
    for carpeta, subcarpetas, archivos in os.walk(directorio):
        for archivo in archivos:
            ruta_archivo = os.path.join(carpeta, archivo)
            sys.stdout.write(f'\rBuscando en: {ruta_archivo}')  # Sobrescribir la línea
            sys.stdout.flush()  # Asegurarse de que la salida se actualice inmediatamente
            try:
                with open(ruta_archivo, 'r', encoding='utf-8') as file:
                    # Leer archivo línea por línea
                    for numero_linea, linea in enumerate(file, 1):
                        if palabra_buscada in linea:
                            sys.stdout.write(f'\rCoincidencia encontrada en {ruta_archivo}, línea {numero_linea}: {linea.strip()}')
                            sys.stdout.flush()  # Mostrar la coincidencia inmediatamente
                            break  # Salir de la búsqueda en este archivo, ya que se encontró la palabra
            except (UnicodeDecodeError, PermissionError) as e:
                # Si no se puede abrir el archivo (por ejemplo, si no es de texto o no se tiene permiso)
                continue
    print()  # Para asegurarnos de que haya un salto de línea después de la última búsqueda

if __name__ == '__main__':
    # Obtener el directorio actual donde está ubicado el script
    directorio = os.getcwd()
    palabra_buscada = input("Introduce la palabra que deseas buscar: ")
    print("\nIniciando búsqueda...\n")
    buscar_palabra(directorio, palabra_buscada)
