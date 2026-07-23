const urlModel = require('../models/urlModel')

// Safe redis wrappers - if Redis is down the app keeps running on Mongo instead of crashing
const { safeGet, safeSet } = require('../config/redisClient');


const getUrl = async function (req, res) {
    try {
        let urlCode = req.params.urlCode
        if (!urlCode) return res.status(400).send({ status: false, message: "Please insert a url code!" })

        if (urlCode.toLowerCase() !== urlCode) return res.status(400).send({ status: false, msg: "The Url Code should be in lower case only!" })

        //========================================
        let cachedProfileData = await safeGet(`${urlCode}`)

        if (cachedProfileData) {
            let data = JSON.parse(cachedProfileData)
            res.redirect(data.longUrl)
        } else {
            let url = await urlModel.findOne({ urlCode: urlCode })
            if (url) {
                await safeSet(`${url.urlCode}`, JSON.stringify(url))
                
                return res.redirect(url.longUrl)
            }
            else {
                return res.status(404).send({ status: false, message: "No Url Found" })
            }

        }

    } catch (error) {
        res.status(500).send({ message: error.message })
    }
}


module.exports.getUrl = getUrl

