require('module-alias/register');

const config = require('config');

// Папка с ресурсами должна быть обозначена в конфигурациях перед началом программы
if (!config.has('RESOURCES_DIRECTORY')) {
    console.error('ERROR: RESOURCES_DIRECTORY configuration has not been set up');
    process.exit(1);
}

const app = require('@root/app');

// Номер порта по умолчанию 4000
if (!process.env.PORT) {
    console.log('PORT has not been set up, defaulting to 4000');
    process.env.PORT = 4000;
}
const port = process.env.PORT;

app.listen(port);
