// Imports
const express = require('express');
const app = express();
const ejs = require('ejs');
const fs = require('fs');
const bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var favicon = require('serve-favicon');

// Fonction de formatage pour l'affichage console
function formatConsole(content, type){
    let contentLen = content.length;
    let spacebetween = (100-contentLen)/2;
    let finalContent = "";
    let spaceTrim = 3;
    if(!Number.isInteger(spacebetween)){
        spaceTrim = 2;
    }
    finalContent += '|';
    for (let i = 0; i <= spacebetween-1; i++) {
        finalContent += ' ';
    }
    finalContent += content;
    for (let i = 0; i <= spacebetween-spaceTrim; i++) {
        finalContent += ' ';
    }
    finalContent += '|';
    finalContent += '\n----------------------------------------------------------------------------------------------------'
    return finalContent;
}

// Accesseur des paramètres de la requête (Je n'avais pas vu la doc sur req.query.item | Fonction inutile)
// ERREURS //
//
// -1 : L'url ne contient pas paramètres
// -2 : L'url ne respect pas la synthaxe
// -3 : L'url contient bien un '&' mais ne respect pas la synthaxe ou il n'y a qu'un paramètre mais il est null ou imcomplet
// -4 : L'url contient un ou plusieurs paramètres null
// -5 : L'url contient un ou plusieurs paramètres ne respectant pas la synthaxe
//
// getParameters(req.url) RETOURNE UN ARRAY DE PARAMETRES
//
function getParameters(req){
    
    let temp;
    if(req.indexOf('?') != -1){ //On vérifie que l'url contient des paramètres
        temp = req.split('?');
        if(temp.length < 3){ //On vérifie qu'il n'y a bien qu'un seul '?' dans l'url
            if(temp[1].indexOf('&') != -1){ //On vérifie s'il y a plusieurs paramètres
                let parameters = temp[1].split('&');
                if(parameters.indexOf("") == -1){ //On vérifie que les paramètres ne sont pas null
                    let parametersAreValid = true;
                    parameters.forEach((e, i) => { //On vérifie que chaque paramètre est valide
                        if(e.indexOf('=') > 0 && e.split('=').indexOf("") == -1){
                            console.log(formatConsole("Paramètre n°" + i + " valide."));
                        } else {
                            console.log(formatConsole("Paramètre n°" + i + " invalide."));
                            parametersAreValid = false;
                        }
                    })
                    if(parametersAreValid){ // Test pour savoir si la boucle n'a pas trouvé de paramètres invalides
                        return parameters;
                    } else {
                        return -5
                    }
                } else {
                    return -4
                }
                
            } else if (temp[1].indexOf('=') > 0 && temp[1].split('=').indexOf('') == -1){ //S'il n'y a pas plusieurs paramètres on vérifie qu'il y en a au moins un et qu'il n'est pas null
                return temp[1].split('=');
            } else { //L'url contient bien un '&' mais ne respect pas la synthaxe ou il n'y a qu'un paramètre mais il est null ou imcomplet
                return -3;
            }

        } else { //L'url ne respect pas la synthaxe
            return -2;
        }
    } else { //L'url ne contient pas paramètres
        return -1;
    }
    
}

// Récupérer la dernière version du json et le transformer en objet js qui servira de base de données
//
// Pas de paramètres
// Retourne un Objet();
//
function dbGet(){
    db = JSON.parse(fs.readFileSync('uploads/database.json'));
    return db;
}

// Permet de vérifier que les données utilisateur concordent
//
// Prend deux paramètres ->
//      user : Champ utilisateur de type String
//      pwd : Champ mot de passe de type String
//
// Retourne false si aucun compte ne correspond aux données entrées.
// Retourne true si les données entrées correspondent à une compte enregistré.
//
function dbLogin(user, pwd){
    let dbArray = Object.entries(db.database);
    let dbLogin = false;
    dbArray.forEach(element => {
        if(element[1]['user'] == user && element[1]['pwd'] == pwd){
            dbLogin =  true;
        }
    });

    return dbLogin;
}

// Permet de créer une session
//
// Prend deux paramètres ->
//      i : L'id ou l'index de l'utilisateur dont on veut créer une session de type int
//      req : La req que le serveur à reçu, elle est necessaire pour la création d'une session
//
// Retourne false si la session n'a pas pu être créée
// Retourne true si la session est créée
//
function dbMakeSession(i, req){
    db = dbGet();
    let dbArray = Object.entries(db.database);
    let dbUser = false;
    dbArray.forEach(index => {
        if(index[0] == i){
            sess = req.session;
            sess.firstname = index[1]['firstname'];
            sess.lastname = index[1]['lastname'];
            sess.user = index[1]['user'];
            sess.pwd = index[1]['pwd'];
            sess.role = index[1]['role'];
            dbUser = true;
        }
    });

    return dbUser;
}

// Permet d'obtenir un utilisateur à partir de son id/index
//
// Prend un paramètre ->
//      i : L'id ou l'index de l'utilisateur que l'on veut récupérer
//
// Retourne l'utilisateur demandé s'il est trouvé
// Retourne undefined en cas d'echec
//
function dbUserById(id){
    return db['database'][id];
}

// Permet d'obtenir l'index d'un utilisateur à partir de son pseudo/identifiant
//
// Prend un paramètre ->
//      user : pseudo/identifiant de l'utilisateur dont on veut récupérer l'index
//
// Retourne l'index de l'utilisateur demandé s'il est trouvé
// Retourne null en cas d'echec
//
function dbIndexByUser(user){
    let dbArray = Object.entries(db.database);
    let dbIndex = null;
    dbArray.forEach(element => {
        if(element[1]['user'] === user){
            dbIndex =  element[0];
        }
    });
    return dbIndex;
}

// Permet de créer un json à partir de l'index d'un utilisateur contenant ses données personnelles
//
// Prend un paramètre ->
//      id : index de l'utilisateur dont on veut créer le json
//
// Ne retourne rien
//
function dbUserToJson(id){
    db = dbGet();
    let user = dbUserById(id);
    fs.appendFileSync('uploads/utilisateur_' + user.user + '.json')
    fs.writeFileSync('uploads/utilisateur_' + user.user + '.json', JSON.stringify(user))
}

// Permet de supprimer un json généré par un utilisateur à partir de son index
//
// Prend un paramètre ->
//      id : index de l'utilisateur dont on veut supprimer le json
//
// Ne retourne rien
//
function dbUserToJsonDelete(id){
    db = dbGet();
    let user = dbUserById(id);
    fs.unlinkSync('uploads/utilisateur_' + user.user + '.json')
}

// Permet de modifier des données déjà existantes présentes dans le json
//
// Prend trois paramètres ->
//      id : index de l'utilisateur dont on veut modifier une valeur, type int
//      field : la clé/champ de la valeur à modifier, type String
//      value : nouvelle valeur affectée à cette clé, type String
//
// Ne retourne rien
//
function dbModify(id, field, value){
    db = dbGet();
    let user = dbUserById(id);
    user[field] = value;
    db['database'][dbIndexByUser(user.user)] = user;
    console.log(JSON.stringify(db));
    fs.writeFileSync('uploads/database.json', JSON.stringify(db));
}

// Permet de créer un objet User
//
// Prend quatre paramètres ->
//      firstname : prénom de l'utilisateur
//      lastname : nom de l'utilisateur
//      user : identifiant de l'utilisateur
//      pwd : mot de passe de l'utilisateur
//
// Retourne un objet utilisateur
//
function dbMakeUserInstance(firstname, lastname, user, pwd){
    let nuser = new Object();
    nuser.firstname = firstname;
    nuser.lastname = lastname;
    nuser.user = user;
    nuser.pwd = pwd;
    nuser.role = 'ROLE_USER';
    return nuser;
}

// Permet de faire persister un objet User en l'ajoutant au fichier json
//
// Prend un paramètre ->
//      user : utilisateur à faire persister, type Object()
//
// Ne retourne rien
//
function dbMakeUser(user){
    db = dbGet();
    let dbArray = Object.entries(db.database);
    db['database'][dbArray.length+1] = user;
    console.log(db);
    fs.writeFileSync('uploads/database.json', JSON.stringify(db));
}

// Permet de supprimer un utilisateur via son objet
//
// Prend un paramètre ->
//      user : prend l'objet user à supprimer, type Object()
//
// Ne retourne rien
//
function dbDelUser(user){
    db = dbGet();
    delete db['database'][dbIndexByUser(user.user)];
    console.log(db);
    fs.writeFileSync('uploads/database.json', JSON.stringify(db));
}

//Variables globales
let sess;
let db;

//Middlewares
app.use(bodyParser.urlencoded({ extended: true })); // Permet de récupérer les données de la requête et de les parser
app.use(cookieParser()); // On utilise cookieParser pour permettre la création de var de session
app.use(favicon(__dirname + '/public/images/logo-node.png'));

// Utilisation du middleware session
app.use(session({
    secret: 'secret is secret',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: true }
}))

// Affichage dans la console des URL demandées
app.use((req, res, next) => {
    console.log(formatConsole("URL demandée : " + req.method + req.url));
    next();
});

// Définition de la route client sur le serveur
app.use('/', express.static('public'));

// Accueil | Method = GET
app.get('/', (req, res, next) => {
    res.render('base', {
        'template_name': 'accueil',
        'user' : sess,
    });
    if(getParameters(req.url).length || getParameters(req.url)>0){
        let param = getParameters(req.url);
        if(param[0] == 'isAdmin' && param[1] == 'true'){
            dbMakeSession(1, req);
            console.log(formatConsole("Ouverture de la session admin index 1"));
        }
    }
});

// Compte | Method = GET
app.get('/compte', (req, res, next) => {
    if(sess) {
        res.render('base', {
            'template_name': 'compte',
            'user' : sess,
        });
    } else {
        res.redirect('connexion');
    }
});

// Données Personnelles | Method = POST
app.post('/donnees-personnelles', (req, res, next) => {
    dbGet();
    let notification = null;
    let classNotification = 'alert alert-danger';
    if(req.body.firstname != sess.firstname || req.body.lastname != sess.lastname){
        notification = 'Les informations suivantes : ' 
        if(req.body.firstname != sess.firstname){
            dbModify(dbIndexByUser(sess.user), 'firstname', req.body.firstname);
            notification += 'Prénom ';
        }
        if(req.body.lastname != sess.lastname){
            dbModify(dbIndexByUser(sess.user), 'lastname', req.body.lastname);
            notification += 'Nom ';
        }
        dbMakeSession(dbIndexByUser(sess.user), req);
        notification += 'ont été modifiés avec succès !'
        classNotification = 'alert alert-success';
    } else {
        notification = 'Echec de la modification de vos informations personnelles !';
    }
    res.render('base', {
        'template_name': 'data',
        'user' : sess,
        'notification' : notification,
        'classNotification' : classNotification
    });
});

// Données Personnelles | Method = GET
app.get('/donnees-personnelles', (req, res, next) => {
    if(sess) {
        res.render('base', {
            'template_name': 'data',
            'user' : sess,
            'notification' : null,
        });
    } else {
        res.redirect('connexion')
    }
});

// Connexion | Method = POST
app.post('/connexion', (req, res, next) => {
    dbGet();
    let notification = null;
    let classNotification = 'alert alert-danger';

    if(req.body.user && req.body.pwd){
        if(dbLogin(req.body.user, req.body.pwd)){
            dbMakeSession(dbIndexByUser(req.body.user), req);
            res.status(201).redirect('compte');
        } else {
            notification = 'Mot de passe incorrect !'
        }
    } else if(req.body.user_new && req.body.pwd_new && req.body.pwd_confirm && req.body.lastname_new && req.body.firstname_new) {
        if(dbIndexByUser(req.body.user_new) == null){
            if(req.body.pwd_new == req.body.pwd_confirm){
                dbMakeUser(dbMakeUserInstance(req.body.firstname_new, req.body.lastname_new, req.body.user_new, req.body.pwd_new))
                notification = 'Votre compte a bien été créé !';
                classNotification = 'alert alert-success';
            } else {
                notification = 'Les mots de passes ne sont pas identiques !';
            }
        } else {
            notification = 'Un autre usager possède déjà ce nom d\'utilisateur ! '
        }
    } else {
        notification = 'Tous les champs n\'ont pas été renseignés';
    }
    res.render('base', {
        'template_name': 'connexion',
        'user' : sess,
        'notification': notification,
        'classNotification' : classNotification
    });
    
});

// Connexion | Method = GET
app.get('/connexion', (req, res, next) => {
    res.render('base', {
        'template_name': 'connexion',
        'user' : sess,
        'notification' : null
    });
});

// Fonctionnalités Cachées | Method = GET
app.get('/fonctionnalites-cachees', (req, res, next) => {
    if(sess){
        res.render('base', {
            'template_name': 'hide',
            'user' : sess,
        });
    } 
    else {
        res.redirect('connexion');
    }
});

// Télechargement | Method = GET
app.get('/telechargement', (req, res, next) => {
    if(sess){
        dbUserToJson(dbIndexByUser(sess.user))
        res.download('uploads/utilisateur_' + sess.user + '.json');
    } else {
        res.redirect('connexion');
    }
});

// Mot de passe | Method = POST
app.post('/mot-de-passe', (req, res, next) => {
    dbGet();
    let notification = null;
    let classNotification = 'alert alert-danger';
    if(dbLogin(sess.user, req.body.pwd_old)){
        if(req.body.pwd_new == req.body.pwd_confirm){
            if(req.body.pwd_new != sess.pwd){
                dbModify(dbIndexByUser(sess.user), 'pwd', req.body.pwd_new);
            }
            notification = 'Modifications effectuées avec succès !';
            classNotification = 'alert alert-success';
        } else {
            notification = 'Les mots de passe ne correspondent pas !';
        }
    } else {
        notification = 'Le mot de passe actuel est incorrect !';
    }
    res.render('base', {
        'template_name': 'password',
        'user' : sess,
        'notification' : notification,
        'classNotification' : classNotification
    });
    dbMakeSession(dbIndexByUser(sess.user), req);
});

// Mot de passe | Method = GET
app.get('/mot-de-passe', (req, res, next) => {
    if(sess){
        res.render('base', {
            'template_name': 'password',
            'user' : sess,
            'notification' : null
        });
    } else {
        res.redirect('connexion');
    }
});

// Utilisateurs | Method = GET
app.get('/utilisateurs', (req, res, next) => {
    if(sess){
        let notification = null;
        let classNotification = 'alert alert-success';
        if(req.query.e || req.query.s){
            if(req.query.s == 'success'){
                notification = 'Suppression effectuée avec succès !';
            }
            if(req.query.e == 'success'){
                notification = 'Edition effectuée avec succès !';
            } else if (req.query.e == 'failure'){
                notification = 'Echec de l\'édition !';
                classNotification = 'alert alert-danger';
            }
        }
        if(sess.role == 'ROLE_ADMIN'){
            res.render('base', {
                'template_name': 'users',
                'user' : sess,
                'db' : Object.entries(db.database),
                'notification' : notification,
                'classNotification' : classNotification
            });
        } else {
            res.status(201).redirect('compte');
        }
    } else {
        res.status(201).redirect('connexion');
    }
});

// Utilisateurs | Method = GET | Suppression | Paramètre ->
//      id : index/id de l'utilisateur à supprimer
//
app.get('/utilisateurs/suppression/:id', (req, res, next) => {
    if(sess){
        if(sess.role == 'ROLE_ADMIN'){
            dbDelUser(dbUserById(req.params.id));
            res.status(201).redirect('/utilisateurs?s=success');
        } else {
            res.status(201).redirect('/compte');
        }
    } else {
        res.status(201).redirect('/connexion');
    }
});

// Utilisateurs | Method = GET | Edition | Paramètres ->
//      id : index/id de l'utilisateur à modifier
//      role : nouvelle valeur affectée au rôle d'un utilisateur
//
app.get('/utilisateurs/edition/:id', (req, res, next) => {
    if(sess){
        if(sess.role == 'ROLE_ADMIN'){
            if(req.query.role == 'ROLE_ADMIN' || req.query.role == 'ROLE_USER'){
                dbModify(req.params.id, 'role', req.query.role);
                res.status(201).redirect('/utilisateurs?e=success'); 
            } else {
                res.status(201).redirect('/utilisateurs?e=failure'); 
            }
        } else {
            res.status(201).redirect('/compte');
        }
    } else {
        res.status(201).redirect('/connexion');
    }
});

// Deconnexion
app.use('/deconnexion', (req, res, next) => {
    // Le destroy() ne fonctionne pas
    //
    //sess.destroy(function(err) {
    //    console.log(err);
    //});
    sess = null; // Reset les cookies.
    res.redirect('/');
});

// Gestion des pages inexistantes
app.use(function(req, res){
    res.render('base', {
        'template_name': '404',
        'user' : sess,
    });
});

module.exports = app;