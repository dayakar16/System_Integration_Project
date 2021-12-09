'use strict';

const async = require('async');
const fs = require('fs');
const https = require('https');
const path = require("path");
const createReadStream = require('fs').createReadStream
const sleep = require('util').promisify(setTimeout);
const ComputerVisionClient = require('@azure/cognitiveservices-computervision').ComputerVisionClient;
const ApiKeyCredentials = require('@azure/ms-rest-js').ApiKeyCredentials;

const key = '3e469363db434cc180282a20a771f9f4';
const endpoint = 'https://computervisionapidaya.cognitiveservices.azure.com/';

const computerVisionClient = new ComputerVisionClient(
    new ApiKeyCredentials({ inHeader: { 'Ocp-Apim-Subscription-Key': key } }), endpoint);


exports.computerVision = async (URL, val) => {
    if (val == "Analyze") {
        console.log('Analyzing URL image to describe...', URL.split('/').pop());
        const caption = (await computerVisionClient.describeImage(URL)).captions[0];
        const res = `This may be ${caption.text} ${caption.confidence.toFixed(2)} confidence`;
        return res;
    }
    if (val == "Detect Type") {

        console.log('Analyzing type in image...', URL.split('/').pop());
        const types = (await computerVisionClient.analyzeImage(URL, { visualFeatures: ['ImageType'] })).imageType;
        const res = `Image appears to be ${describeType(types)}`;

        function describeType(imageType) {
            if (imageType.clipArtType && imageType.clipArtType > imageType.lineDrawingType) return 'clip art';
            if (imageType.lineDrawingType && imageType.clipArtType < imageType.lineDrawingType) return 'a line drawing';
            return 'a photograph';
        }
        return res;
    }
    if (val == "Detect Category") {
        console.log('Analyzing category in image...', URL.split('/').pop());
        const categories = (await computerVisionClient.analyzeImage(URL)).categories;
        console.log(`Categories: ${formatCategories(categories)}`);
        const res = `Categories: ${formatCategories(categories)}`;
        function formatCategories(categories) {
            categories.sort((a, b) => b.score - a.score);
            return categories.map(cat => `${cat.name} (${cat.score.toFixed(2)})`).join(', ');
        }
        return res;
    }
    if (val == "Detect Brand") {
        console.log('Analyzing brands in image...', URL.split('/').pop());
        const brands = (await computerVisionClient.analyzeImage(URL, { visualFeatures: ['Brands'] })).brands;
        if (brands.length) {
            const res = []
            console.log(`${brands.length} brand${brands.length != 1 ? 's' : ''} found:`);
            res.push(`${brands.length} brand${brands.length != 1 ? 's' : ''} found:`)
            for (const brand of brands) {
                console.log(`${brand.name} (${brand.confidence.toFixed(2)} confidence)`);
                res.push(` ${brand.name} (${brand.confidence.toFixed(2)} confidence)`)
            }
            return res;
        } else {
            const res = `No brands found.`;
            return res;
        }

    }

    if (val == "Detect Color") {

        console.log('Analyzing image for color scheme...', URL.split('/').pop());
        console.log();
        const color = (await computerVisionClient.analyzeImage(URL, { visualFeatures: ['Color'] })).color;
        function printColorScheme(colors) {
            console.log(`Image is in ${colors.isBwImg ? 'black and white' : 'color'}`);
            console.log(`Dominant colors: ${colors.dominantColors.join(', ')}`);
            console.log(`Dominant foreground color: ${colors.dominantColorForeground}`);
            console.log(`Dominant background color: ${colors.dominantColorBackground}`);
            console.log(`Suggested accent color: #${colors.accentColor}`);
            res.push(`Image is in ${colors.isBwImg ? 'black and white' : 'color'}`)
            res.push(`Dominant colors: ${colors.dominantColors.join(', ')}`)
            res.push(`Dominant foreground color: ${colors.dominantColorForeground}`)
            res.push(`Dominant background color: ${colors.dominantColorBackground}`)
            res.push(`Suggested accent color: #${colors.accentColor}`)
        }
        const res = []
        printColorScheme(color);
        return res;
    }


    if (val == "Detect Objects") {



        function formatRectObjects(rect) {
            return `top=${rect.y}`.padEnd(10) + `left=${rect.x}`.padEnd(10) + `bottom=${rect.y + rect.h}`.padEnd(12)
                + `right=${rect.x + rect.w}`.padEnd(10) + `(${rect.w}x${rect.h})`;
        }

        console.log('Analyzing objects in image...', URL.split('/').pop());
        const objects = (await computerVisionClient.analyzeImage(URL, { visualFeatures: ['Objects'] })).objects;
        if (objects.length) {
            const res = []
            console.log(`${objects.length} object${objects.length == 1 ? '' : 's'} found:`);
            res.push(`${objects.length} object${objects.length == 1 ? '' : 's'} found:`);
            for (const obj of objects) {
                res.push(`    ${obj.object} (${obj.confidence.toFixed(2)}) at ${formatRectObjects(obj.rectangle)}`);
                console.log(`    ${obj.object} (${obj.confidence.toFixed(2)}) at ${formatRectObjects(obj.rectangle)}`);
            }
            return res;
        } else {
            const res = 'No objects found.';
            return res;
        }


    }

    if (val == "Detect Faces") {
    

        console.log('Analyzing faces in image...', URL.split('/').pop());
        // Get the visual feature for 'Faces' only.
        const faces = (await computerVisionClient.analyzeImage(URL, { visualFeatures: ['Faces'] })).faces;


        function formatRectFaces(rect) {
            return `top=${rect.top}`.padEnd(10) + `left=${rect.left}`.padEnd(10) + `bottom=${rect.top + rect.height}`.padEnd(12)
                + `right=${rect.left + rect.width}`.padEnd(10) + `(${rect.width}x${rect.height})`;
        }



        if (faces.length) {
            const res = []
            console.log(`${faces.length} face${faces.length == 1 ? '' : 's'} found:`);
            res.push(`${faces.length} face${faces.length == 1 ? '' : 's'} found:`);
            for (const face of faces) {
                console.log(`    Gender: ${face.gender}`.padEnd(20)
                    + ` Age: ${face.age}`.padEnd(10) + `at ${formatRectFaces(face.faceRectangle)}`);
                res.push(`    Gender: ${face.gender}`.padEnd(20)
                + ` Age: ${face.age}`.padEnd(10) + `at ${formatRectFaces(face.faceRectangle)}`);
            }
           return res; 
        } else { const res = 'No faces found.'; 
        return res;     
    }  

    }
    if (val == "Detect Adult Content") {
        const isIt = flag => flag ? 'is' : "isn't";
        const res = []
        // Analyze URL image
        console.log('Analyzing image for racy/adult content...', URL.split('/').pop());
        const adult = (await computerVisionClient.analyzeImage(URL, {
            visualFeatures: ['Adult']
        })).adult;
        console.log(`This probably ${isIt(adult.isAdultContent)} adult content (${adult.adultScore.toFixed(4)} score)`);
        console.log(`This probably ${isIt(adult.isRacyContent)} racy content (${adult.racyScore.toFixed(4)} score)`);
        res.push(`This probably ${isIt(adult.isAdultContent)} adult content (${adult.adultScore.toFixed(4)} score)`);
        res.push(`This probably ${isIt(adult.isRacyContent)} racy content (${adult.racyScore.toFixed(4)} score)`);
        return res; 
    }

}