const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PostSchema = new Schema({
    user: String,
    title: String,
    message: String
}, {
    timestamps: true
});


const Post = mongoose.model('post', PostSchema);

// Add a 'dummy' user if one doesnt exist
const post = new Post({
    user: 'bart',
    title: 'First post!',
    message: 'Im so excited to use this new social platform!'
});

Post.findOne({ user: 'bart' })
    .then((postFound) => {
        if(postFound === null){
            post.save();
        }   
    })
    .catch((error) => {
        console.log(error);
    })

module.exports = Post;