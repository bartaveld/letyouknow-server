var neo4j = require('neo4j');

var db = new neo4j.GraphDatabase('http://neo4j:5685zAsLUWHo@localhost:7474');

module.exports = db;