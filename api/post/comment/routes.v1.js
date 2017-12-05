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
                .then(() => {
                    res.status(201).json({message: 'comment made!'})
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
                .then(() => {
                    res.status(200).json({message : 'Comment was removed'});
                })
                .catch((err) => {
                    res.status(400).json(err);
                })
        }
    });
});


module.exports = routes;