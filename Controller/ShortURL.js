const validation = require('../validation/validation')
const urlModel = require('../models/urlModel')
const shortid = require('shortid');

// Safe redis wrappers - if Redis is down the app keeps running on Mongo instead of crashing
const { safeGet, safeSet } = require('../config/redisClient');


const shortUrl = async function (req, res) {
    try {
        const data = req.body;

        if (validation.isBodyEmpty(data)) return res.status(400).send({ status: false, message: "Please provide required Data" });

        const longUrl = data.longUrl
        if (!validation.isValid(longUrl)) return res.status(400).send({ status: false, message: "Please provide valid longUrl" });

        if (!validation.isValidUrl(longUrl)) res.status(400).send({ status: false, message: `longUrl "${longUrl}" is not valid` });
        let reg = /^(ftp|http|https):\/\/[^ "]+$/
        if (!reg.test(longUrl)) return res.status(400).send({ status: false, message: "Please provide a valid url" })

        let urlId = shortid.generate()
        urlId = urlId.toLowerCase();

        
        
        //===================================================
        // Dynamic baseUrl: http://localhost:3000 locally, the public https URL on Codespaces.
        // Prefer x-forwarded-* headers set by the Codespaces/reverse proxy over the raw host.
        const proto = req.headers["x-forwarded-proto"] || req.protocol
        const host = req.headers["x-forwarded-host"] || req.get("host")
        const baseUrl = `${proto}://${host}`
        let cachedProfileData = await safeGet(`${longUrl}`)
        if (cachedProfileData) {
            let data = JSON.parse(cachedProfileData)
            return res.status(200).send({ status: true, data: { urlCode: data.urlCode, longUrl: longUrl, shortUrl: `${baseUrl}/${data.urlCode}` } })
        } else {
            const isUrlExist = await urlModel.findOne({ longUrl: longUrl })

            if (isUrlExist) {
                await safeSet(`${isUrlExist.longUrl}`, JSON.stringify(isUrlExist))

                return res.status(200).send({ status: true, data: { urlCode: isUrlExist.urlCode, longUrl: longUrl, shortUrl: `${baseUrl}/${isUrlExist.urlCode}` } })
            }
            else {
                let myObject = {
                    urlCode: urlId,
                    longUrl: longUrl,
                    shortUrl: `${baseUrl}/${urlId}`
                }

                await urlModel.create(myObject);
                await safeSet(`${longUrl}`, JSON.stringify(myObject))
                res.status(201).send({ status: true, data: myObject })
            }

        }
        //====================================================================





        // if(isUrlExist) return res.status(200).send({status:true, data:{urlCode:isUrlExist.urlCode, longUrl:longUrl, shortUrl:`${baseUrl}/${isUrlExist.urlCode}`}})



    } catch (error) {
        res.status(500).send({ status: false, message: error.message })
    }

}

module.exports = { shortUrl }



