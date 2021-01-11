const mongoose = require('mongoose')

mongoose.connect(process.env.MONGODB_URL, {
    useNewUrlParser: true,
    useCreateIndex: true, //Creates index when mongoose used with MongoDb
    useFindAndModify: false //Addresses deprecation warning 
})


