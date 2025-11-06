const express = require('express');
const cors = require('cors');



const port = 5000;
const app = express();

app.use(cors())
require('./model/user')
require('./model/Review')


app.use(express.json());
app.use(require('./routes/auth'))
app.use(require('./routes/features'))
app.use(require('./routes/order'))
app.use(require('./routes/admin'))
app.use(require('./routes/reviews'))
// app.use(require('./routes/payment'))



app.listen(port , () => {
    console.log(`Server is running on port ${port}`);
})



const mongoose = require('mongoose');
const {mongoURl}  = require('./keys');


mongoose.connect(mongoURl)


mongoose.connection.on("connected" , () => {
    console.log("Mongoose is connected");
})

mongoose.connection.on("error" , () => {
    console.log("Mongoose is not connected");
})



