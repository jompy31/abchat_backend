import os
import sys

def buscar_palabra(directorio, palabra_buscada):
    # Recorrer todos los archivos y carpetas dentro del directorio
    for carpeta, subcarpetas, archivos in os.walk(directorio):
        for archivo in archivos:
            ruta_archivo = os.path.join(carpeta, archivo)
            try:
                with open(ruta_archivo, 'r', encoding='utf-8') as file:
                    # Leer archivo línea por línea
                    for linea in file:
                        if palabra_buscada in linea:
                            print(f'Coincidencia encontrada en: {ruta_archivo}')
                            break  # Salir de la búsqueda en este archivo, ya que se encontró la palabra
            except (UnicodeDecodeError, PermissionError):
                # Si no se puede abrir el archivo (por ejemplo, si no es de texto o no se tiene permiso)
                continue

if __name__ == '__main__':
    # Obtener el directorio actual donde está ubicado el script
    directorio = os.getcwd()
    palabra_buscada = input("Introduce la palabra que deseas buscar: ")
    print("\nIniciando búsqueda...\n")
    buscar_palabra(directorio, palabra_buscada)
