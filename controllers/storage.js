const fs = require('fs');
const mkdirp = require('mkdirp');
const to = require('await-to-js').default;
const path = require('path');
const config = require('config');
const ip = require('ip');

const validFileName = /^[,.\-_\(\)a-zA-Z0-9а-яА-Я]+.[a-zA-Z]+$/;

// Вспомогательная функция, которая проверяет название файла на валидность
const checkFileName = function(fileName) {
    return validFileName.test(fileName);
}

// Вспомогательная функция, которая проверяет если расширение файла в списке одобренных
const checkFileExtension = function(fileName) {
    if (!config.has('fileSettings.validExtensions')) {
        throw new Error('Sorry, valid file extensions has not been setup, contact project manager to solve this issue');
    }
    var substrings = fileName.split('.');
    var extension = substrings[substrings.length - 1];
    return config.get('fileSettings.validExtensions').includes(extension);
}

// Генерирует название папки в которой будет храниться файл
const generateFileDirectory = function(user, date) {
    return path.join(
        date.getFullYear().toString(),
        date.getMonth().toString(),
        date.getDate().toString(),
        user.type,
        user.id
    );
}

// Вспомогательная функция, проверяет файлы на корректность
const checkFiles = function(files) {
    // Проверяем, что файл был выслан
    if (!files || !files.file) {
        return {
            statusCode: 400,
            message: 'file not received'
        };
    }
    var file = files.file;

    // Проверяем, что файл не имеет лишних символов
    if (!checkFileName(file.name)) {
        return {
            statusCode: 400,
            message: 'invalid file name'
        };
    }

    // Проверка на расширение файла
    try {
        if (!checkFileExtension(file.name)) {
            return {
                statusCode: 400,
                message: 'invalid file extension'
            };
        }
    } catch(err) {
        return {
            statusCode: 500,
            message: err.message
        };
    }
    return null;
}

module.exports = {
    // Функция осуществляет загрузку файлов на сервер
    // Прежде всего название файла и его расширение должны быть валидны
    // Размер файла не должен привышать лимит
    uploadMedia: (req, res, next) => {
        const filesCheck = checkFiles(req.files);
        if (filesCheck) {
            return res.status(filesCheck.statusCode).send(filesCheck.message);
        }

        const file = req.files.file;

        // Название папки файла внутри директории ресурсов
        const fileDirectory =
            generateFileDirectory(req.user, new Date());

        // Полное название папки файла включая директорию ресурсов
        const fullFileDirectory = path.join(config.get('RESOURCES_DIRECTORY'), 'media', fileDirectory);

        // Если директории конечного файла не существует, то функция рекурсивно
        // создает каждую поддиректорию
        mkdirp(fullFileDirectory, (err) => {
            if (err) {
                return res.status(500).send(err.message);
            }

            const fileName = path.join(fullFileDirectory, file.name);
            // Смотрим статистику файла с таким названием
            fs.stat(fileName, async function(err, stat) {
                if(err === null) {
                    // Функция не вернула ошибки, значит файл существует,
                    // возвращаем ошибку
                    return res.status(400).send('file already exists');
                } else if(err.code == 'ENOENT') {
                    fs.writeFile(fileName, file.data, (err) => {
                        if (err) {
                            return res.status(500).send(err.message);
                        }

                        return res.status(200).json({
                            link: path.join(`${ip.address()}:${process.env.PORT}`, 'get', path.join(fileDirectory, file.name)),
                            fileName: file.name,
                            mimeType: file.mimetype,
                        });
                    });
                } else {
                    // Функция вернула некую ошибку, кроме ENOENT, значит
                    // проблема с сервером, возвращаем 500
                    return res.status(500).send(err.message);
                }
            });
        });
    },
}
