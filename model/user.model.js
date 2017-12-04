var userSchema = {
    "type": "object",
    "properties" : {
        "username": {
            "type": "string"
        },
        "password" : {
            "type" : "string"
        }
    }, 
    "required" : ["username", "password"]
}

module.exports = userSchema;