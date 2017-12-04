var express = require('express');
var routes = express.Router();
var mongodb = require('../../../config/mongo.db');
var Post = require('../../../model/post.model');
var jwt = require('jsonwebtoken');
var neo4j = require('../../../config/neo4j.db');

const JWTKey = process.env.JWTKEY;

//Sort array on date
function sortArray(array) {
    array.sort(function compare(a, b) {
        var dateA = new Date(a.createdAt);
        var dateB = new Date(b.createdAt);
        return dateB - dateA;
      });
      return array;
}

//Get all posts with most recent on top
//Also possible to get posts from one user
routes.post('/post/:id/comment', function (req, res) {
    res.contentType('application/json');
    id = req.params.id; 

    
    // const token = req.headers.authtoken;
    // username = req.query.username;
    
    // jwt.verify(token, JWTKey, (err, decoded) => {
    //     if(err){
    //         res.status(401).json(err)
    //     } else {
    //         if(username){
    //             Post.find({ user: username })
    //             .then((posts) => {
    //                 res.status(200).json(sortArray(posts));
    //             })
    //             .catch((error) => {
    //                 res.status(400).json(error);
    //             });
    //         } else {
    //             Post.find({})
    //                 .then((posts) => {
    //                     res.status(200).json(sortArray(posts));
    //                 })
    //                 .catch((error) => {
    //                     res.status(400).json(error);
    //                 });
    //         }
    //     }
    // });
});

module.exports = routes;