var express = require('express');
var routes = express.Router();
var neo4j = require('../../config/neo4j.db');
var jwt = require('jsonwebtoken');

const JWTKey = process.env.JWTKEY;

//Lets you follow a user
routes.post('/follow', function(req,res) {
    res.contentType('application/json');
    const token = req.headers.authtoken;
    jwt.verify(token, JWTKey, (err, decoded) => {
        if(err){
            res.status(401).json(err);
        } else {
            const username = decoded.user
            const userToFollow = req.body.user;
            neo4j.cypher({
                query: 'MATCH(user :User{username: $username })'
                + 'MATCH(userToFollow :User{username: $userToFollow })'
                + 'CREATE (user)-[r:follows]->(userToFollow)'
                + 'RETURN userToFollow',
                params: { username: username, userToFollow: userToFollow }
            }, function (err, result) {
                if(err){
                    res.status(400).json(err);
                } else {
                    res.status(200).json({message: 'following ' + userToFollow + ' was a success'});
                }
            });
        }
    })
});


//Lets you unfollow a user
routes.delete('/follow', function(req,res) {
    res.contentType('application/json');
    const token = req.headers.authtoken;
    jwt.verify(token, JWTKey, (err, decoded) => {
        if(err){
            res.status(401).json(err);
        } else {
            const username = decoded.user
            const userToUnfollow = req.body.user;
            neo4j.cypher({
                query: 'MATCH( :User{username: $username })-[r:follows]->( :User{username: $userToUnfollow} )'
                + 'DELETE r',
                params: { username: username, userToUnfollow: userToUnfollow }
            }, function (err, result) {
                if(err){
                    res.status(400).json(err);
                } else {
                    res.status(200).json({message: 'unfollowing ' + userToUnfollow + ' was a success'});
                }
            });
        }
    })
});


//Mark a user as not interesting
routes.post('/not-interested', function(req,res) {
    res.contentType('application/json');
    const token = req.headers.authtoken;
    const userNotInterestedIn = req.body.user;
    jwt.verify(token, JWTKey, (err, decoded) => {
        const username = decoded.user;
        if(err){
            res.status(401).json(err);
        } else {
            neo4j.cypher({
                query: 'MATCH(user :User{username: $username })'
                + 'MATCH(userNotInterestedIn :User{username: $userNotInterestedIn })'
                + 'CREATE (user)-[r:not_interested]->(userNotInterestedIn)'
                + 'RETURN userNotInterestedIn',
                params: { username: username,  userNotInterestedIn: userNotInterestedIn}
            }, function (err, result) {
                if(err){
                    res.status(400).json(err);
                } else {
                    console.log(result);
                    res.status(200).json({message: userNotInterestedIn + ' is marked as not interesting'});
                }
            });
        }
    });    
});

//Returns all users that you follow
routes.get('/follow/list', function(req,res) {
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
                + 'RETURN youFollow.username AS name',
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