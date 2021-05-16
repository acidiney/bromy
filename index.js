require('dotenv').config();
const mongoose = require('mongoose');
const Momy = require('momy');

const MONGODB_CONNECTION_STRING = process.env.MONGODB_URL;

const momyfile = {
  src: MONGODB_CONNECTION_STRING,
  dist: process.env.MYSQL_CONNECTION_STRING,
  prefix: 'tb_',
  case: 'camel',
  collections: {},
};

// TODO: use regex to know data type of a value
// const testValue = {
//   DATETIME:
//     '^(?=d)(?:(?:31(?!.(?:0?[2469]|11))|(?:30|29)(?!.0?2)|29(?=.0?2.(?:(?:(?:1[6-9]|[2-9]d)?(?:0[48]|[2468][048]|[13579][26])|(?:(?:16|[2468][048]|[3579][26])00)))(?:\x20|$))|(?:2[0-8]|1d|0?[1-9]))([-./])(?:1[012]|0?[1-9])\1(?:1[6-9]|[2-9]d)?dd(?:(?=\x20d)\x20|$))(|([01]d|2[0-3])(:[0-5]d){1,2})?$',
//   number: '^[0-9]*$',
//   string: '(.*)',
// };

/**
 *
 * @param {object[]} collectionData
 * @param {string} collectionName
 */
function generateSchemaCollection(collectionData, collectionName) {
  if (!momyfile.collections[collectionName]) {
    momyfile.collections[collectionName] = {};
  }

  for (const row of collectionData) {
    const keys = Object.keys(row);

    console.log(`[x] ${collectionName} - Verifying value`);
    for (const key of keys) {
      if (
        !momyfile.collections[collectionName][key] &&
        !['__v', '__EMPTY', 'errors'].includes(key)
      ) {
        let rowType = 'string';
        // const regexNames = Object.keys(testValue);

        // console.log(`[x] ${collectionName} - Testing regex to know datatype`);
        // for (const name of regexNames) {
        //   const regEx = new RegExp(testValue[name]);

        //   if (regEx.test(row[key])) {
        //     rowType = name;
        //     break;
        //   }
        // }

        momyfile.collections[collectionName][key.trim()] = rowType;
      }
    }
  }
}
console.log(`----------------------------------------------------`);
console.log(`[x] - Welcome to Bromy CLI`);
console.log(`----------------------------------------------------`);

mongoose
  .connect(MONGODB_CONNECTION_STRING, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(async () => {
    const collectionsNames = (
      await mongoose.connection.db.listCollections().toArray()
    ).map((collection) => collection.name);

    console.log(`[x] - Retrinving all collections`);
    for (const collectionName of collectionsNames) {
      const collection = mongoose.connection.db.collection(collectionName);

      console.log(`[x] - Generating dynamic schema for ${collectionName}`);



      generateSchemaCollection(
        await collection.find().toArray(),
        collectionName
      );
    }

    console.log(`----------------------------------------------------`);
    console.log(`[x] - Using Momy to import data to mysql`);
    console.log(`----------------------------------------------------`);


    new Momy(momyfile).importAndStart()

  })
  .catch((err) => {
    console.log(err);
  });
