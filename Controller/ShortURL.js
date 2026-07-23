const validation = require('../validation/validation')
const urlModel = require('../models/urlModel')
const shortid = require('shortid');
const QRCode = require('qrcode');

// Safe redis wrappers - if Redis is down the app keeps running on Mongo instead of crashing
const { safeGet, safeSet } = require('../config/redisClient');

// Generate a QR code (PNG data URL) for a link using the 'qrcode' npm package
const makeQr = function (url) {
    return QRCode.toDataURL(url, {
        width: 240,
        margin: 2,
        color: { dark: "#0b0b12", light: "#ffffff" },
    });
};


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
        // baseUrl: browser's Origin header is the reliable public URL (Codespaces proxies
        // Host to localhost). Fall back to the request host for non-browser clients (Postman).
        const proto = req.headers["x-forwarded-proto"] || req.protocol
        const host = req.headers["x-forwarded-host"] || req.get("host")
        const baseUrl = req.headers.origin || `${proto}://${host}`

        let cachedProfileData = await safeGet(`${longUrl}`)
        if (cachedProfileData) {
            let data = JSON.parse(cachedProfileData)
            const shortUrl = `${baseUrl}/${data.urlCode}`
            const qrCode = await makeQr(shortUrl)
            return res.status(200).send({ status: true, data: { urlCode: data.urlCode, longUrl: longUrl, shortUrl, qrCode } })
        } else {
            const isUrlExist = await urlModel.findOne({ longUrl: longUrl })

            if (isUrlExist) {
                await safeSet(`${isUrlExist.longUrl}`, JSON.stringify(isUrlExist))

                const shortUrl = `${baseUrl}/${isUrlExist.urlCode}`
                const qrCode = await makeQr(shortUrl)
                return res.status(200).send({ status: true, data: { urlCode: isUrlExist.urlCode, longUrl: longUrl, shortUrl, qrCode } })
            }
            else {
                let myObject = {
                    urlCode: urlId,
                    longUrl: longUrl,
                    shortUrl: `${baseUrl}/${urlId}`
                }

                await urlModel.create(myObject);
                await safeSet(`${longUrl}`, JSON.stringify(myObject))

                const qrCode = await makeQr(myObject.shortUrl)
                res.status(201).send({ status: true, data: { ...myObject, qrCode } })
            }

        }
        //====================================================================





        // if(isUrlExist) return res.status(200).send({status:true, data:{urlCode:isUrlExist.urlCode, longUrl:longUrl, shortUrl:`${baseUrl}/${isUrlExist.urlCode}`}})



    } catch (error) {
        res.status(500).send({ status: false, message: error.message })
    }

}

module.exports = { shortUrl }



