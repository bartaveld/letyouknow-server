//
// ./api/v1/user.routes.v1.js
//
var express = require('express');
var routes = express.Router();
var neo4j = require('../../config/neo4j.db');
var bcrypt = require('bcrypt');
var jwt = require('jsonwebtoken');

const saltRounds = Number(process.env.SALT);
const JWTKey = process.env.JWTKEY;

//Lets you login
routes.post('/login', function( req, res ) {
    res.contentType('application/json');
    const username = req.body.username;
    const password = req.body.password;

    neo4j.cypher({
        query: 'MATCH (user : User {username: $username } ) RETURN user',
        params: { username: username }
    }, function ( err, result ) {
        if(err){
            res.status(400).json( err );
        } else {
            if( bcrypt.compareSync( password, result[0].user.properties.password ) ){
                //Make env variable
                const token = jwt.sign({ user: username }, JWTKey, { expiresIn: '2h' });
                res.status(200).json( { login: 'success', token: token } );
            } else {
                res.status(401).json( { login: 'failed' })
            }
        }
    });
});

//lets you register
routes.post('/register', function(req,res) {
    res.contentType('application/json');
    const username = req.body.username;
    const password = bcrypt.hashSync( req.body.password, saltRounds );

    neo4j.cypher({
        query: 'CREATE (user : User {username: $username, password: $password}) RETURN user',
        params: { username: username, password: password }
    }, function (err, result) {
        if(err){
            res.status(400).json(err);
        } else {
            res.status(200).json({ message: username + ' was created'});
        }
    });
});


module.exports = routes;