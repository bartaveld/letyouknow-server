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

    if(req.body.username === undefined || req.body.password === undefined){
        res.status(400).json({message : 'no body'})
    } else {
        neo4j.cypher({
            query: 'MATCH (user : User {username: $username } ) RETURN user',
            params: { username: username }
        }, function ( err, result ) {
            if(err){
                res.status(400).json( err );
            } else {
                if(result[0] != undefined){
                    if( bcrypt.compareSync( password, result[0].user.properties.password ) ){
                        const user = result[0].user.properties;
                        const token = jwt.sign({ user: username }, JWTKey, { expiresIn: '24h' });
                        res.status(200).json( { login: 'success', token: token, username: username
                        , firstName: user.firstName, lastName: user.lastName, imagePath: user.imagePath } );
                    } else {
                        res.status(401).json( { login: 'failed' })
                    }
                } else {
                    res.status(401).json( { login: 'failed' })
                }
            }
        });
    }
});

module.exports = routes;