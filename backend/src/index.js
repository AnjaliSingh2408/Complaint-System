import 'dotenv/config'


dotenv.config({
    path:'./.env'
});

connectDB()
.then(()=>{
    port=process.env.port||3000
    app.listen(port, ()=>{
        console.log(`Server is Listening on port ${port}`)
    })
})
.catch((err)=>{
    console.log(`DB Connection Failed: ${err.message}`)
})