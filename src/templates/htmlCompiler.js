const fs = require('fs');
const path = require('path');
const handlebars = require('handlebars');
const { paths } = require('../config/constants');
const registerPartials = require('./partialLoader')

handlebars.registerHelper('eq', function(a, b) {
  return a === b;
});

function compile(templateFileName) {
    const tplPath = path.join(paths.templatesDir, templateFileName);
    const content = fs.readFileSync(tplPath, 'utf8');
    return handlebars.compile(content);
}

function render(templateFileName, data) {
    const tpl = compile(templateFileName);
    return tpl(data);
}

function renderToFile(templateFileName, outputFileName, data) {
    registerPartials();
    const html = render(templateFileName, data);
    const outPath = path.join(paths.outputDir, outputFileName);
    fs.writeFileSync(outPath, html, 'utf8');
    console.log(`${outputFileName} gerado com sucesso!`);
}

module.exports = { compile, render, renderToFile };