require('dotenv').config();
const express = require('express');
const cors = require('cors');
const puppeteer = require('puppeteer');
const handlebars = require('handlebars');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 3001;

app.use(cors({
    origin: process.env.CLIENT_URL || '*'
}));
app.use(express.json());

app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

const signaturePath = path.join(__dirname, 'media', 'sig.png');
let signatureBase64 = '';
if (fs.existsSync(signaturePath)) {
    const sigBuffer = fs.readFileSync(signaturePath);
    signatureBase64 = `data:image/png;base64,${sigBuffer.toString('base64')}`;
}

app.post('/generate-pdf', async (req, res) => {
    try {
        const data = req.body;

        const templateHtml = fs.readFileSync(path.join(__dirname, 'template.html'), 'utf8');
        const template = handlebars.compile(templateHtml);
        
        if (!data.signatureUrl && signatureBase64) {
            data.signatureUrl = signatureBase64;
        }

        const html = template(data);

        const browser = await puppeteer.launch({
            executablePath: '/usr/bin/brave-browser',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        
        await page.setContent(html, { waitUntil: 'networkidle0' });
        
        const pdf = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
                top: '0',
                right: '0',
                bottom: '0',
                left: '0'
            }
        });

        await browser.close();

        res.contentType('application/pdf');
        res.send(pdf);
    } catch (error) {
        console.error('PDF Generation Error:', error);
        res.status(500).send('Error generating PDF');
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
