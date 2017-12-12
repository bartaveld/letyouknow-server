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
routes.get('/users', function( req, res ) {
    res.contentType('application/json');
    const token = req.headers.authtoken;
    const username = req.query.username;

    jwt.verify(token, JWTKey, (err, decoded) => {
        if(err){
            res.status(400).json(err);
        } else {

            if(username){
                neo4j.cypher({
                    query: 'MATCH (user :User) WHERE user.username CONTAINS $username RETURN user',
                    params: { username: username }
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
            } else {
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
            }
        }
    });
});

//Lets you register
routes.post('/users', function(req,res) {
    res.contentType('application/json');
    
    if(validator.validate(req.body, User).valid){
        const username = req.body.username;
        const password = bcrypt.hashSync( req.body.password, saltRounds );
        const firstName = req.body.firstName;
        const lastName = req.body.lastName;

        if(username === '' || password === '' || firstName === '' || lastName === ''){
            res.status(400).json({message : 'Everything needs to be filled in'});
        } 
        else {
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
                            query: 'CREATE (user : User {username: $username, password: $password, firstName: $firstName, lastName: $lastName, imagePath: ""})' 
                            + 'RETURN user',
                            params: { username: username, password: password, firstName: firstName, lastName: lastName }
                        }, function (err, result) {
                            if(err){
                                res.status(400).json(err);
                            } else {
                                res.status(201).json({ message: username + ' was created'});
                            }
                        });
                    }
                }
            });
        }
    
    } else {
        res.status(400).json({ message : "body is not a valid user"})
    }

});

//Lets you update a user
routes.put('/users', function(req,res) {
    res.contentType('application/json');
    const token = req.headers.authtoken;
    jwt.verify(token, JWTKey, (err, decoded) => {
        if(err){
            res.status(400).json(err);
        } else {
            const username = decoded.user;
            const firstName = req.body.firstName;
            const lastName = req.body.lastName;
            const imagePath = req.body.imagePath;

            const mockUser = {
                username: 'mock',
                password: 'mock',
                firstName: firstName,
                lastName: lastName,
                imagePath: imagePath
            }
        
            if(validator.validate(mockUser, User).valid){
                neo4j.cypher({
                    query: 'MATCH (user :User {username: $username})'
                    + 'SET user.firstName = $firstName, user.lastName = $lastName, user.imagePath = $imagePath',
                    params: { username: username, firstName: firstName, lastName: lastName, imagePath: imagePath }
                }, function (err, result) {
                    if(err){
                        res.status(400).json(err);
                    } else {
                        res.status(200).json({ message: username + ' was updated'});
                    }
                });
            } else {
                res.status(400).json({ message : "body is not a valid user"})
            }
        }
    });
});

//Lets you delete your user
routes.delete('/users', function(req,res) {
    res.contentType('application/json');
    const token = req.headers.authtoken;
    jwt.verify(token, JWTKey, (err, decoded) => {
        if(err){
            res.status(400).json(err);
        } else {
            const username = decoded.user;
        
                neo4j.cypher({
                    query: 'MATCH (user :User {username: $username})'
                    + 'DETACH DELETE user',
                    params: { username: username }
                }, function (err, result) {
                    if(err){
                        res.status(400).json(err);
                    } else {
                        res.status(200).json({ message: username + ' was deleted'});
                    }
                });
        }
    });
});

//Returns all usernames of people you may want to follow
routes.get('/users/suggestions', function(req,res) {
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
                + 'RETURN theyFollow LIMIT 10',
                params: { username: username }
            }, function (err, result) {
                if(err){
                    res.status(400).json(err);
                } else {

                    const userList = [];
                    result.forEach(user => {
                        if(user.theyFollow.properties.username != username){
                            userList.push(user.theyFollow.properties)
                        }
                    });
                    res.status(200).json(userList);
                }
            });
        }
    });    
});

//Returns all users that follow you
routes.get('/users/followers', function(req,res) {
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

//Returns all users that follow you
routes.get('/users/:username', function(req,res) {
    res.contentType('application/json');
    const token = req.headers.authtoken;
    jwt.verify(token, JWTKey, (err, decoded) => {
        const username = req.params.username;
        if(err){
            res.status(401).json(err);
        } else {
            neo4j.cypher({
                query: 'MATCH(user :User{username: $username })'
                + 'RETURN user',
                params: { username: username }
            }, function (err, result) {
                if(err){
                    res.status(400).json(err);
                } else {
                    user = result[0].user.properties;
                    delete user.password;
                    res.status(200).json(user);
                }
            });
        }
    });    
});

module.exports = routes;