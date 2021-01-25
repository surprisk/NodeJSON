//imports
const http = require('http');
const app = require('./app'); //Module app dans le fichier app.js
var opn = require('opn');

//Création du serveur sur le port 8080
app.set('port', process.env.PORT || 8080);
app.set('views', './templates');
app.set('view engine', 'ejs');

const server = http.createServer(app);
server.listen(process.env.PORT || 8080);
server.on('listening', () => {
opn('http://localhost:8080/');
console.log('----------------------------------------------------------------------------------------------------');
console.log('|                                         Serveur démarré !                                        |');
console.log('----------------------------------------------------------------------------------------------------');
console.log('|                                 Ouverture de http://localhost:8080/                              |');
console.log('----------------------------------------------------------------------------------------------------');
}); 