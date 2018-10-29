const fs = require('fs');
const mkdirp = require('mkdirp');
const to = require('await-to-js').default;
const path = require('path');
const config = require('config');
const ip = require('ip');
const nanoid = require('nanoid');

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
    // Расширение должно быть валидно
    uploadMedia: async (req, res, next) => {
        const filesCheck = checkFiles(req.files);
        if (filesCheck) {
            return res.status(filesCheck.statusCode).send(filesCheck.message);
        }

        const file = req.files.file;

        const fileNameSubstrings = file.name.split('.');
        const hash = await nanoid();
        const fileHashName = `${hash}.${fileNameSubstrings[fileNameSubstrings.length - 1]}`;

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

            const fileName = path.join(fullFileDirectory, fileHashName);
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
                            link: 'http://' + path.join(`${ip.address()}:${process.env.PORT}`, 'get', path.join(fileDirectory, fileHashName)),
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
