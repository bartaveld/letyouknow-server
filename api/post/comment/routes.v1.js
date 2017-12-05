var express = require('express');
var routes = express.Router();
var mongodb = require('../../../config/mongo.db');
var Post = require('../../../model/post.model');
var jwt = require('jsonwebtoken');
var neo4j = require('../../../config/neo4j.db');

const JWTKey = process.env.JWTKEY;

//Comment on a post
routes.post('/posts/:id/comments', function (req, res) {
    res.contentType('application/json');
    id = req.params.id;
    const token = req.headers.authtoken; 

    jwt.verify(token, JWTKey, (err, decoded) => {
        if(err){
            res.status(401).json(err);
        } else {
            Post.findById(id)
                .then((post) => {
                    post.comments.push({
                        user: decoded.user,
                        message: req.body.message
                    });
                    return post.save()
                })
                .then((post) => {
                    res.status(201).json(post)
                })
                .catch((err) =>{
                    res.status(400).json(err);
                })
        }
    });
});

//Delete a comment on a post
routes.delete('/posts/:postid/comments/:commentid', function (req, res) {
    res.contentType('application/json');
    postid = req.params.postid;
    commentid = req.params.commentid;
    const token = req.headers.authtoken; 

    jwt.verify(token, JWTKey, (err, decoded) => {
        if(err){
            res.status(401).json(err);
        } else {
            Post.findById(postid)
                .then((post) => {
                    const comment = post.comments.id(commentid);
                    console.log(comment);
                    if(post.username === decoded.user || comment.user === decoded.user){
                        comment.remove();
                        return post.save();
                    } else {
                        res.status(401).json({message : 'Not your comment or post'})
                    }
                })
                .then((post) => {
                    res.status(200).json(post);
                })
                .catch((err) => {
                    res.status(400).json(err);
                })
        }
    });
});

//Update a comment on a post
routes.put('/posts/:postid/comments/:commentid', function (req, res) {
    res.contentType('application/json');
    postid = req.params.postid;
    commentid = req.params.commentid;
    const token = req.headers.authtoken; 

    message = req.body.message;

    jwt.verify(token, JWTKey, (err, decoded) => {
        if(err){
            res.status(401).json(err);
        } else {
            Post.findById(postid)
                .then((post) => {
                    const comment = post.comments.id(commentid);
                    console.log(comment);
                    if(comment.user === decoded.user){
                        comment.message = message;
                        return post.save();
                    } else {
                        res.status(401).json({message : 'Not your comment'})
                    }
                })
                .then((post) => {
                    res.status(200).json(post);
                })
                .catch((err) => {
                    res.status(400).json(err);
                })
        }
    });
});

//Get all comment from a post
routes.get('/posts/:id/comments/', function (req, res) {
    res.contentType('application/json');
    id = req.params.id;
    const token = req.headers.authtoken; 

    jwt.verify(token, JWTKey, (err, decoded) => {
        if(err){
            res.status(401).json(err);
        } else {
            Post.findById(id)
                .then((post) => {
                    res.status(200).json(post.comments);
                })
                .catch((err) => {
                    res.status(400).json(err);
                })
        }
    });
});

//Get one comment from a post
routes.get('/posts/:postid/comments/:commentid', function (req, res) {
    res.contentType('application/json');
    postid = req.params.postid;
    commentid = req.params.commentid;
    const token = req.headers.authtoken; 

    jwt.verify(token, JWTKey, (err, decoded) => {
        if(err){
            res.status(401).json(err);
        } else {
            Post.findById(postid)
                .then((post) => {
                    const comment = post.comments.id(commentid)
                    if(comment){
                        res.status(200).json(comment);
                    } else {
                        res.status(400).json({message: 'comment with id ' + commentid + ' does not exist'})
                    }
                })
                .catch((err) => {
                    res.status(400).json(err);
                })
        }
    });
});



module.exports = routes;