module.exports = function(app, config, firebase_admin, mysql_config) {
    var express = require('express');
    var router = express.Router();
    //
    // mssql_connect.then(pool => {
    //     return pool.request()
    //         .query('select * from Users')
    // }).then(result => {
    //     console.dir(result)
    // }).catch(err => {
    //     console.dir(err)
    // });

    // var registrationToken = 'dKjKk8F5rDI:APA91bEQ9jGaxmDOFqMozf4g_tXSaqKKhKG66M_BydGiAFYFnOWi227sMLT6SsihVqF9e-4yIYytjQpe-HF9DDVHKWABTTyaCp9KLjq9m4cZ4n5fDbS_tFg8BSW0xqSHIhSb8V3lHkv_E0FRGRwpysIrUkOSeOIxqw';
    // var payload = {
    //     notification: {
    //         title: "This is a Notification",
    //         body: "This is the body of the notification message.",
    //         sound: "march.mp3"
    //     }
    // };
    //
    // var options = {
    //     priority: "high",
    //     timeToLive: 60 * 60 *24
    // };
    // firebase_admin.messaging().sendToDevice(registrationToken, payload, options)
    //     .then((response) => {
    //         // Response is a message ID string.
    //         console.log('Successfully sent message:', response.results);
    //     })
    //     .catch((error) => {
    //         console.log('Error sending message:', error);
    //     });



    /* GET home page. */
    router.get('/', function (req, res, next) {
        res.render('index', {title: 'Express'});
    });

    return router;
};