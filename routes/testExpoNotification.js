const express = require('express')
const router = express.Router()
const { Expo } = require('expo-server-sdk')
const expo = new Expo()

// Endpoint para testear Expo Notification
router.post('/test-expo-notification', async (req, res) => {
    const { exponentPushToken, message } = req.body
    if (!exponentPushToken || !message) {
        return res
            .status(400)
            .json({
                success: false,
                error: 'Faltan parámetros: exponentPushToken y message son requeridos.',
            })
    }
    try {
        if (!Expo.isExpoPushToken(exponentPushToken)) {
            return res
                .status(400)
                .json({ success: false, error: 'El token no es válido.' })
        }
        const messages = [
            {
                to: exponentPushToken,
                sound: 'default',
                body: message,
                data: { test: true },
            },
        ]
        const chunks = expo.chunkPushNotifications(messages)
        let allReceipts = []
        for (let chunk of chunks) {
            try {
                let receipts = await expo.sendPushNotificationsAsync(chunk)
                allReceipts.push(receipts)
            } catch (err) {
                return res
                    .status(500)
                    .json({
                        success: false,
                        error: 'Error enviando notificación',
                        details: err.message,
                    })
            }
        }
        return res.json({ success: true, receipts: allReceipts })
    } catch (err) {
        return res
            .status(500)
            .json({
                success: false,
                error: 'Error interno',
                details: err.message,
            })
    }
})

module.exports = router
