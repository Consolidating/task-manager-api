//User Router
const express = require('express')
const router = new express.Router()
const multer = require('multer')
const sharp = require('sharp')
const auth = require('../middleware/auth')
const User = require('../models/user')
const { sendWelcomeEmail, sendDeleteEmail } = require('../emails/account')

//USER ROUTES

router.post('/users', async (req,res)=>{

    const user = new User(req.body)
    try {
        await user.save()
        sendWelcomeEmail(user.email, user.name)
        const token = await user.generateAuthToken() 
        res.status(201).send({user, token})
    } catch (e) {
        res.status(400).send(e)
    }
})


//Verify Login
router.post('/users/login', async(req,res)=>{
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password)
    
        const token = await user.generateAuthToken() //Generate token for specific user, custom method defined on user instance 
     

        res.send({user, token})
 
    } catch (e) {

        res.status(400).send()
        

    }
})


//Logout
router.post('/users/logout',auth, async (req, res)=>{
    try{
        req.user.tokens = req.user.tokens.filter((token)=>{
            return token.token !== req.token
        })

        await req.user.save()

        res.send()

    }catch(e){
        res.status(500).send()

    }

})

//Logout all sessions
router.post('/users/logoutAll',auth, async (req, res)=>{
    console.log(req.tokens)

    try{
        req.user.tokens = []

        await req.user.save()

        res.send()

    }catch(e){
        res.status(500).send()

    }

})



router.get('/users/me', auth,async (req,res)=>{
    res.send(req.user)
})


router.get('/users/:id', async (req,res)=>{ //Syntax that express provides to extract params value 
    const _id = req.params.id
    try {
        const user = await User.findById(_id)
        if (!user){
            return res.status(404).send()
        }
        res.send(user)
    } catch (e) {
        res.status(500).send();
    }
})


router.delete('/users/me', auth, async (req,res)=>{
    try {
        await req.user.remove()
        sendDeleteEmail(req.user.email,req.user.name)
        res.send(req.user)
    } catch (e) {
        res.status(500).send()
    }
})

router.patch('/users/me', auth, async (req,res)=>{
    const updates = Object.keys(req.body) //Keys will return of strings where each property is object 
    const allowedUpdate = ['name', 'email', 'password', 'age']
    const isValidOperation = updates.every((update)=> {
        return allowedUpdate.includes(update)
    })
    if (!isValidOperation) {
        return res.status(400).send( { error: "Invalid updates"})
    }
    try {
        updates.forEach((update)=>{
            req.user[update] = req.body[update]
        })

        await req.user.save();
        res.send(req.user)
    } catch (e) {
        res.status(400).send(e)
    }
})



const upload = multer({
    limits:{
        fileSize: 1000000
    },
    fileFilter(req,file,cb){
        if (!file.originalname.match(/\.(jpg|png|jpeg)$/)){
            return cb(new Error("Please upload an image"))
        }
        cb(undefined, true)
    }
})


router.post('/users/me/avatar', auth, upload.single('avatar'), async (req,res)=>{
    const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer()
    req.user.avatar = buffer
    await req.user.save()
    res.send();
}, (error, req, res,next)=>{
    res.status(400).send({ error: error.message })
})

router.delete('/users/me/avatar', auth, async (req,res)=>{
    try {
        req.user.avatar = undefined
        await req.user.save()
        
        res.send()

    } catch (e) {
        res.status(500).send(e)
    }
})



router.get('/users/:id/avatar', async (req,res)=>{
    try{
        const user = await User.findById(req.params.id)
        if (!user || !user.avatar) {
            throw new Error()
        }

        res.set('Content-Type','image/png')
        res.send(user.avatar)


    } catch (e) {
        res.status(404).send()
    }
})


//Export it to be used in index
module.exports = router