import TinyDiInjectable from '../tinydiinjectable';
import * as express from 'express';
import * as jwt from 'jsonwebtoken';
import * as fs from 'fs';
import * as path from 'path';
import {Logger} from '../logger';

let users = require('../../users');

export default class Authentication extends TinyDiInjectable {
  constructor(server: express.Express, logger: Logger, privateKeyPath: string) {
    super();

    let cert = fs.readFileSync(privateKeyPath, 'utf8');
    
    server.post('/auth/login', (req, res) => {
      if (users[req.body.username] && users[req.body.username] === req.body.password) {
        //login correct
        let profile = {
          username: req.body.username
        };
        
        // we are sending the profile in the token
        jwt.sign(profile, cert, { expiresIn: '1h' }, 
          (err, token) => {
            if (err) {
              logger.log('Failed to sign token with error: ' + err);
              res.sendStatus(500);
            } else {
              res.json({token: token});
            }
          });
        
      } else {
        //login failed
        res.sendStatus(401);
      }
    });
  }
}
Authentication.$inject = {
  deps: ['server', 'logger', 'privateKeyPath'],
  callAs: 'class'
};
