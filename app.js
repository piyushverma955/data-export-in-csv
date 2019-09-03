var inquirer = require('inquirer');
const mongoose = require('mongoose');
let mongoUrl = "mongodb://localhost:27017";
let XLSX = require('xlsx');
let fs = require("fs");
let path = require("path");

init()

function init() {
    inquirer
        .prompt([
            {
                type: 'input',
                name: 'db',
                message: 'Please enter Db name',
            },
            {
                type: 'input',
                name: 'collection',
                message: 'Please enter Collection name',
            }
        ])
        .then(answers => {
            if (answers.db != '' && answers.db != '') {
                let options = {
                    dbName: answers.db,
                    useNewUrlParser: true
                };

                mongoose.connect(mongoUrl, options)
                    .then(() => {
                        return mongoose.connection.db.collection(answers.collection).find({}).toArray();
                    })
                    .then(data => {
                        let flat = data.map(doc => flatten(doc, true));
                        return createFile(flat, answers.collection);
                    })
                    .then(() => {
                        console.log('Exporting Done ...');
                        console.log('file path ',path.join(__dirname, answers.collection+'.csv'));
                        process.exit(0);
                    })
                    .catch(err => {
                        console.log('Cannot Connect to DB');
                        console.log(err);
                        process.exit(0);
                    })
            }
            else {
                console.log('Please Enter DB or Collection name');
            }
        })
}

function flatten(obj, deep, parent) {
    let temp = {};
    if (obj) {
        Object.keys(obj).forEach(function (key) {
            const thisKey = parent ? parent + '.' + key : key;
            if (typeof obj[key] === 'object') {
                if (Array.isArray(obj[key])) {
                    if (deep) {
                        obj[key].forEach((item, i) => {
                            if (typeof item === 'object') {
                                Object.assign(temp, flatten(item, deep, thisKey + '.' + i))
                            } else {
                                temp[thisKey + '.' + i] = item;
                            }
                        });
                    } else {
                        temp[thisKey] = obj[key];
                    }
                }
                else if (obj[key] instanceof Date) {
                    temp[thisKey] = obj[key];
                }
                else {
                    temp = Object.assign(temp, flatten(obj[key], deep, thisKey));
                }
            }
            else {
                temp[thisKey] = obj[key];
            }
        });
        return temp;
    }
};

function createFile(data, file) {
    return new Promise((resolve, reject) => {
        const sheet = XLSX.utils.json_to_sheet(data);
        const abc = XLSX.utils.sheet_to_csv(sheet);
        fs.writeFileSync(`${file}.csv`, abc, 'utf8');
        resolve();
    })
}
