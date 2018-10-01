const url = require('url');
module.exports = function(app, cfg, router) {
    router.all('*', function (req, res, next) {
        if (
            req.originalUrl === '/auth/login' ||
            url.parse(req.url, true).pathname === '/users/getbytoken' ||
            url.parse(req.url, true).pathname === '/users/new' ||
            url.parse(req.url, true).pathname === '/incident/checknotification' ||
            url.parse(req.url, true).pathname === '/incident/getbynotification'
        ) {
            next()
        } else if(req.headers.authorization !== undefined && req.headers.authorization !== null) {
            const token = req.headers.authorization.replace(/Bearer /g,"");
            try {
                const decoded = jwt.verify(token, cfg.jwtSecret);
                ad.findUser(decoded.login, function (err, user) {
                    if (err) {
                        console.log('ERROR: ' + JSON.stringify(err));
                        res.status(403).send(JSON.stringify(err));
                        return;
                    }
                    if (!user) {
                        console.log(`User: ${decoded.login} not found.`);
                    }
                    else {
                        console.log(JSON.stringify(user));
                        ad.authenticate(decoded.login, decoded.password, async function (err, auth) {
                            if (err) {
                                console.log('ERROR: ' + JSON.stringify(err));
                                res.status(403).send(JSON.stringify(err));
                                return;
                            }
                            if (auth) {
                                console.log(`${decoded.login} Authenticated!`);
                                next()
                            }
                            else {
                                console.log(`${req.body.user} Authenticated failed!`);
                                res.status(403).send(JSON.stringify(err));
                            }
                        });
                    }
                });
            } catch (err) {
                console.log(500);
                res.status(403).send(err.message)
            }
        } else {
            res.status(403).send('Access denied')
        }
    });

    let ActiveDirectory = require('activedirectory2');
    let config = {
        url: cfg.ldapurl,
        baseDN: cfg.ldapbaseDN,
        username: cfg.username,
        password: cfg.password
    };
    let ad = new ActiveDirectory(config);
    const jwt = require('jsonwebtoken');
    router.post('/auth/login', (req, res) => {
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
                        let token = await jwt.sign({login: req.body.user.login, password: req.body.user.password},
                            cfg.jwtSecret,
                            {
                                expiresIn: '24h'
                            });
                        res.status(200).send({ auth: true, token: token, user:  { name: req.body.user.login, isAdmin: 1 } });
                        console.log(token);
                        console.log(jwt.verify(token, cfg.jwtSecret))
                    }
                    else {
                        console.log(`${req.body.user} Authenticated failed!`);
                        res.status(403).send(JSON.stringify(err));
                    }
                });
            }
        });
    });
    return router;
};