const e = require('express');
const {analysis, computerVision} = require('../model/model');


exports.index = (req, res, next)=>{
    res.render('./index')
};


exports.show = (req, res, next)=>{
    let image = req.body.image;
    let value = req.body.option;
    if (image == "" || undefined) { 
        let err = new Error('Incorrect Input' );
        err.status = 404;
        next(err);
    }
    if (value == undefined) {
        value = "Analyze"
    }
     computerVision(image,value)
      .then(response=>{
          console.log(response)
          res.render('./image', {image, response, value})
    })
      .catch(err=>{
        if (err.code == 'InvalidArgument') { 
            let err = new Error('Incorrect Input');
            err.status = 404;
            next(err);
        } else {
            next(err)
        }
         })
};