const express = require('express');
const controller = require('../controller/controller');

const router = express.Router();


router.get('/', controller.index);

router.post('/analyze', controller.show);

module.exports = router;