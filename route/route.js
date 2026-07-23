const express = require('express');
const router = express.Router();

const shortUrlController = require('../Controller/ShortURL')
const getUrlController = require('../Controller/getUrl')


router.post('/url/shorten',shortUrlController.shortUrl)

router.get('/:urlCode', getUrlController.getUrl)

router.all("/**", function (req, res) {
    res.status(404).send({
        status: false,
        msg: "The api you requested is not available"
    })
})

module.exports= router;