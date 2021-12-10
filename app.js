//require modules
const express = require('express');
const morgan = require('morgan');
const methodOverride = require('method-override');
const Routes = require('./Router/Router.js');

//create app
const app = express();

//configure app
let port = 3000;
app.set('view engine', 'ejs');


app.use(express.static('public'));
app.use(express.urlencoded({extended: true}));
app.use(morgan('tiny'));
app.use(methodOverride('_method'));

//set up routes
app.use('/', Routes);

app.use((req, res, next) => {
    let err = new Error('The server cannot locate ' + req.url);
    err.status = 404;
    next(err);

});

app.use((err, req, res, next)=>{
    console.log(err.stack);
    if(!err.status) {
        err.status = 500;
        err.message = ("Internal Server Error");
    }

    res.status(err.status);
    res.render('error', {error: err});
});

app.listen(port, ()=>{
    console.log('Server is running on port', port);
});