var neo4j = require('neo4j');

var dbUrl = process.env.NODE_ENV === 'production' ? process.env.NEO4J : process.env.TESTNEO4J

var db = new neo4j.GraphDatabase(dbUrl);

module.exports = db;