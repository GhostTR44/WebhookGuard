const express = require('express');
const multer = require('multer');
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

const app = express();
const port = 80;

const upload = multer({ dest: 'uploads/' });

app.use(express.json());

app.post('/upload', upload.single('file'), async (req, res) => {
    try {
        const file = req.file;
        const { content, embeds, username, avatar_url, payload_json } = req.body;

        const webhookUrl = 'WEBHOOK_URL';

        let payload;

        if (payload_json) {
            payload = JSON.parse(payload_json);
        } else {
            payload = {};
            if (content) {
                payload.content = content;
            }
            if (embeds) {
                try {
                    const parsedEmbeds = typeof embeds === 'string' ? JSON.parse(embeds) : embeds;
                    if (Array.isArray(parsedEmbeds)) {
                        payload.embeds = parsedEmbeds;
                    } else {
                        throw new Error('Embeds should be an array.');
                    }
                } catch (error) {
                    return res.status(400).send('Invalid embeds format.');
                }
            }
            if (username) {
                payload.username = username;
            }
            if (avatar_url) {
                payload.avatar_url = avatar_url;
            }
        }

        if (file) {
            const formData = new FormData();
            formData.append('file', fs.createReadStream(file.path), file.originalname);
            formData.append('payload_json', JSON.stringify(payload));

            await axios.post(webhookUrl, formData, {
                headers: formData.getHeaders(),
            });

            fs.unlinkSync(file.path);

            res.status(200).send('File and message sent to Discord webhook successfully.');
        } else {
            await axios.post(webhookUrl, payload, {
                headers: { 'Content-Type': 'application/json' },
            });

            res.status(200).send('Message sent to Discord webhook successfully.');
        }
    } catch (error) {
        res.status(500).send('An error occurred while uploading the file and sending the message.');
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
