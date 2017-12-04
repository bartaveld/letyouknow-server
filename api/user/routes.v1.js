var express = require('express');
var routes = express.Router();
var neo4j = require('../../config/neo4j.db');
var bcrypt = require('bcrypt');
var jwt = require('jsonwebtoken');

const saltRounds = Number(process.env.SALT);
const JWTKey = process.env.JWTKEY;

//Get all users
routes.get('/user', function( req, res ) {
    res.contentType('application/json');

    neo4j.cypher({
        query: 'MATCH (user : User) RETURN user'
    }, function ( err, result ) {
        if(err){
            res.status(400).json( err );
        } else {
            const userList = []
            result.forEach(element => {
                user = element.user.properties;
                delete user.password;
                userList.push(user);
            });
            res.status(200).json(userList);
        }
    });
});

module.exports = routes;