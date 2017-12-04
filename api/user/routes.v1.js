var express = require('express');
var routes = express.Router();
var neo4j = require('../../config/neo4j.db');
var bcrypt = require('bcrypt');
var jwt = require('jsonwebtoken');
var User = require('../../model/user.model');
var Validator = require('jsonschema').Validator;
var validator = new Validator();

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

//Lets you register
routes.post('/user', function(req,res) {
    res.contentType('application/json');
    
    if(validator.validate(req.body, User).valid){
        const username = req.body.username;
        const password = bcrypt.hashSync( req.body.password, saltRounds );
    
        let usernameCheck;
        neo4j.cypher({
            query: 'MATCH (user : User {username: $username}) RETURN user',
            params: { username: username }
        }, function (err, result) {
            if(err){
                res.status(400).json(err);
            } else {
                usernameCheck = result[0];
                
                if(usernameCheck != undefined){
                    res.status(400).json({message: username + ' already exists'});
                } else {
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
                }
            }
        });
    } else {
        res.status(400).json({ message : "body is not a valid user"})
    }

});

//Returns all usernames of people you may want to follow
routes.get('/user/suggestion', function(req,res) {
    res.contentType('application/json');
    const token = req.headers.authtoken;
    jwt.verify(token, JWTKey, (err, decoded) => {
        const username = decoded.user;
        if(err){
            res.status(401).json(err);
        } else {
            neo4j.cypher({
                query: 'MATCH(user :User{username: $username })'
                + 'MATCH(user)-[:follows]->(youFollow)'
                + 'MATCH(youFollow)-[:follows]->(theyFollow)'
                + 'WHERE NOT (user)-[:follows]->(theyFollow) AND NOT (user)-[:not_interested]->(theyFollow)'
                + 'RETURN theyFollow.username AS name LIMIT 10',
                params: { username: username }
            }, function (err, result) {
                if(err){
                    res.status(400).json(err);
                } else {
                    const userList = [];
                    result.forEach(user => {
                        if(user.name != username){
                            userList.push(user.name)
                        }
                    });
                    res.status(200).json(userList);
                }
            });
        }
    });    
});

//Returns all users that follow you
routes.get('/user/follower', function(req,res) {
    res.contentType('application/json');
    const token = req.headers.authtoken;
    jwt.verify(token, JWTKey, (err, decoded) => {
        const username = decoded.user;
        if(err){
            res.status(401).json(err);
        } else {
            neo4j.cypher({
                query: 'MATCH(user :User{username: $username })'
                + 'MATCH(followsYou)-[:follows]->(user)'
                + 'RETURN followsYou.username AS name',
                params: { username: username }
            }, function (err, result) {
                if(err){
                    res.status(400).json(err);
                } else {
                    const userList = [];
                    result.forEach(user => {
                        if(user.name != username){
                            userList.push(user.name)
                        }
                    });
                    res.status(200).json(userList);
                }
            });
        }
    });    
});

module.exports = routes;