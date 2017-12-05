var express = require('express');
var routes = express.Router();
var mongodb = require('../../config/mongo.db');
var Post = require('../../model/post.model');
var jwt = require('jsonwebtoken');
var neo4j = require('../../config/neo4j.db');

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
routes.get('/posts', function (req, res) {
    res.contentType('application/json');
    
    const token = req.headers.authtoken;
    username = req.query.username;
    
    jwt.verify(token, JWTKey, (err, decoded) => {
        if(err){
            res.status(401).json(err)
        } else {
            if(username){
                Post.find({ user: username })
                .then((posts) => {
                    res.status(200).json(sortArray(posts));
                })
                .catch((error) => {
                    res.status(400).json(error);
                });
            } else {
                Post.find({})
                    .then((posts) => {
                        res.status(200).json(sortArray(posts));
                    })
                    .catch((error) => {
                        res.status(400).json(error);
                    });
            }
        }
    });
});

//Get all posts from people you follow with the most recent on top
routes.get('/posts/followers', function(req,res) {
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
                    let findAllPosts = new Promise((resolve, reject) => {
                        const postList = [];
                        const length = userList.length;
                        let count = 0;
                        userList.forEach(user => {
                            Post.find({ user: user })
                                .then((posts) => {
                                    postList.push.apply(postList, posts);
                                    count++;
                                    console.log(count)
                                    if (count === length){
                                        resolve(postList);
                                    }
                                })
                                .catch((error) => {
                                    res.status(400).json(error);
                                });
                        });
                    }).then((postList) => {
                        res.status(200).json(sortArray(postList));
                    });
                }
            });
        }
    });    
});

routes.post('/posts', function(req, res) {
    res.contentType('application/json');
    const token = req.headers.authtoken;
    jwt.verify(token, JWTKey, (err, decoded) => {
        if(err){
            res.status(401).json(err);
        } else {
            let body = req.body;
            body.user = decoded.user;

            const post = new Post(body);
        
            post.save()
                .then(() => {
                    res.status(200).json(post);
                }).catch((error) => {
                    res.status(400).json(error);
                });
        }
    });
    
});

routes.put('/posts/:id', function(req, res) {
    res.contentType('application/json');

    id = req.params.id;
    const token = req.headers.authtoken;

    jwt.verify(token, JWTKey, (err, decoded) => {
        if(err){
            res.status(401).json(err);
        } else {
            Post.findById(id)
                .then((post) => {
                    if(post.user === decoded.user){
                        post.title = req.body.title;
                        post.message = req.body.message;
                        post.save()
                            .then((post) => {
                                res.status(200).json(post);
                            }).catch((err) => {
                                res.status(400).json(err);
                            })
                    } else {
                        res.status(401).json({message : 'Not your post'})
                    }
                }).catch((err) => {
                    res.status(400).json(err);
                })
        }
    });
});

routes.delete('/posts/:id', function(req, res) {
    res.contentType('application/json');

    id = req.params.id;
    const token = req.headers.authtoken;

    jwt.verify(token, JWTKey, (err, decoded) => {
        if(err){
            res.status(401).json(err);
        } else {
            Post.findById(id)
                .then((post) => {
                    if(post.user === decoded.user){
                        post.remove()
                            .then((post) => {
                                res.status(200).json(post);
                            }).catch((err) => {
                                res.status(400).json(err);
                            })
                    } else {
                        res.status(401).json({message : 'Not your post'})
                    }
                }).catch((err) => {
                    res.status(400).json(err);
                })
        }
    });
});




module.exports = routes;