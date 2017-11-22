const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    name: String
}, {
    timestamps: true
});


const User = mongoose.model('user', UserSchema);

// Add a 'dummy' user if one doesnt exist
const user = new User({
    name: 'Joe',
});

User.findOne({ name: 'Joe' })
    .then((userFound) => {
        if(userFound === null){
            user.save();
        }   
    })
    .catch((error) => {
        console.log(error);
    })

module.exports = User;