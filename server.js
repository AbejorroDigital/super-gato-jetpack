/**
 * @file server.js
 * @description Servidor de archivos estáticos ligero para Node.js, destinado al desarrollo local.
 * Gestiona los tipos MIME comunes y proporciona un manejo básico de errores 404.
 * 
 * @requires http
 * @requires fs
 * @requires path
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

/** @type {number} Puerto de red en el que escuchará el servidor */
const PORT = 3000;

/** 
 * @type {Object<string, string>} 
 * @description Mapeo de extensiones de archivo a sus correspondientes encabezados Content-Type.
 */
const MIME_TYPES = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.wav': 'audio/wav',
    '.mp3': 'audio/mpeg',
    '.ogg': 'audio/ogg'
};

/**
 * @constant {http.Server} server
 * @description Instancia del servidor HTTP que resuelve las solicitudes de archivos relativas a la raíz del proyecto.
 */
const server = http.createServer((req, res) => {
    console.log(`request ${req.url}`);

    let filePath = '.' + req.url;
    if (filePath === './') {
        filePath = './index.html';
    }

    const extname = String(path.extname(filePath)).toLowerCase();
    const contentType = MIME_TYPES[extname] || 'application/octet-stream';

    /**
     * Callback para la lectura de archivos y generación de respuestas.
     */
    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                // Devuelve la página 404 si el archivo solicitado no existe
                fs.readFile('./404.html', (err, cont) => {
                    res.writeHead(200, { 'Content-Type': 'text/html' });
                    res.end(cont, 'utf-8');
                });
            } else {
                // Error interno del servidor
                res.writeHead(500);
                res.end(`Lo sentimos, consulte con el administrador del sitio el error: ${error.code} ..\n`);
            }
        } else {
            // Respuesta exitosa
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

/**
 * Inicia la escucha de conexiones entrantes.
 * @listens PORT
 */
server.listen(PORT, () => {
    console.log(`Servidor ejecutándose en http://localhost:${PORT}/`);
});
