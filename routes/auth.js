module.exports = function(app, cfg) {
    let express = require('express');
    let router = express.Router();
    let ActiveDirectory = require('activedirectory2');
    let config = {
        url: cfg.ldapurl,
        baseDN: cfg.ldapbaseDN,
        username: cfg.username,
        password: cfg.password
    }
    let ad = new ActiveDirectory(config);
    const jwt = require('jsonwebtoken');
    router.post('/login', (req, res) => {
        ad.findUser(req.body.user.login, function(err, user) {
            if (err) {
                console.log('ERROR: ' +JSON.stringify(err));
                res.status(403).send(JSON.stringify(err));
                return;
            }
            if (!user) {
                console.log(`User: ${req.body.user.login} not found.`);
            }
            else {
                console.log(JSON.stringify(user));
                ad.authenticate(req.body.user.login, req.body.user.password, async function (err, auth) {
                    if (err) {
                        console.log('ERROR: ' + JSON.stringify(err));
                        res.status(403).send(JSON.stringify(err));
                        return;
                    }
                    if (auth) {
                        console.log(`${req.body.user.login} Authenticated!`);
                        let token = await jwt.sign({login: req.body.user.login, password: req.body.user.password}, cfg.jwtSecret, {expiresIn: 86400 // expires in 24 hours
                        });
                        res.status(200).send({ auth: true, token: token, user:  { name: req.body.user.login, isAdmin: 1 } });
                        console.log(token)
                        console.log(jwt.verify(token, cfg.jwtSecret))
                    }
                    else {
                        console.log(`${req.body.user} Authenticated failed!`);
                        res.status(403).send(JSON.stringify(err));
                    }
                });
            }
        });
    })
    return router;
}