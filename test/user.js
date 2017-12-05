require('dotenv').config();
process.env.NODE_ENV = 'test';

const neo4j = require('../config/neo4j.db');
const User = require('../model/user.model');
const jwt = require('jsonwebtoken');
const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../server');
let should = chai.should();

chai.use(chaiHttp);

const saltRounds = Number(process.env.SALT);
const JWTKey = process.env.JWTKEY;

const token = jwt.sign({ user: 'bartaveld' }, JWTKey, { expiresIn: '2h' });

describe('Users', () => {
    beforeEach((done) => {
        neo4j.cypher({
            query: 'MATCH (n) DETACH DELETE n'
        }, function (err, result) {
            if (err) {
                console.log(err);
            } else {
                chai.request(server)
                    .post('/api/v1/users')
                    .send({ username: 'bartaveld', password: 'password', firstName: 'Bart', lastName: 'in t Veld'})
                    .end((err, res) => {
                        done();
                    })
            }
        })

        
    })

    describe('/GET users', () => {
        it('it should GET all the users', (done) => {
            chai.request(server)
                .get('/api/v1/users')
                .set('AuthToken', token)
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.a('array');
                    res.body.length.should.be.eql(1);
                done();
                });
        });

        it('it should GET one user', (done) => {
            chai.request(server)
                .get('/api/v1/users/bartaveld')
                .set('AuthToken', token)
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.a('object');
                    should.equal(res.body.password, undefined);
                done();
                });
        });
    });

    describe('/POST users', () => {
        it('it should POST a user', (done) => {
            chai.request(server)
                .post('/api/v1/users')
                .send({ username: 'newbart', password: 'password', firstName: 'Bart', lastName: 'in t Veld'})
                .end((err, res) => {
                    res.should.have.status(200);
                    res.should.be.a('object');

                    chai.request(server)
                        .get('/api/v1/users')
                        .set('AuthToken', token)
                        .end((err, res) => {
                            res.should.have.status(200);
                            res.body.should.be.a('array');
                            res.body.length.should.be.eql(2);
                            done();
                        });
                });
        });
    });
});