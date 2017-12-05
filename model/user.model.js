var userSchema = {
    "type": "object",
    "properties" : {
        "username": {
            "type": "string"
        },
        "password" : {
            "type" : "string"
        },
        "firstName" : {
            "type" : "string",
        },
        "lastName" : {
            "type" : "string"
        },
        "imagePath" : {
            "type" : "string"
        }
    }, 
    "required" : ["username", "password", "firstName", "lastName"]
}

module.exports = userSchema;