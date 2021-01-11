//User Router
const express = require('express')
const auth = require('../middleware/auth')
const router = new express.Router();
const Task = require('../models/task')

//TASK ROUTES
//Creating new Task
router.post('/tasks', auth, async (req,res)=>{
    const task = new Task({
        ...req.body, //Copies to object 
        owner: req.user._id //Person authenticated
    })


    try {
        await task.save()
        res.status(201).send(task);
    } catch (e) {
        res.status(400).send(e) //We can set status code 
    }
})


//Delete 

router.delete('/tasks/:id',auth, async (req,res)=>{
    try {
        const task = await Task.findOneAndDelete({_id:req.params.id, owner: req.user._id})
        if (!task){
            return res.status(404).send()
        }
        res.send(task)
    } catch (e) {
        res.status(500).send();

    }
})

//GET /tasks?completed=true/false
//GET /tasks?limit=10&skip=0
//GET /tasks?sortBy=createdAt:desc /tasks?sortBy=createdAt:asc

router.get('/tasks',auth, async (req,res)=>{
    const match = {}
    const sort = {}



    if(req.query.completed){
        match.completed = req.query.completed === 'true'
    }

    if(req.query.sortBy){
        const parts = req.query.sortBy.split(':')
        sort[parts[0]] = parts[1] === 'desc' ? -1 : 1
    }

    try {
        await req.user.populate({
            path: 'tasks',
            match,
            options:{
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort
            }
        }).execPopulate()
        res.send(req.user.tasks)
    } catch (e) {
        res.status(500).send()
    }

})


router.get('/tasks/:id', auth, async (req,res)=>{ 
    const _id = req.params.id
    try {
        const task = await Task.findOne({_id, owner: req.user._id})
        if (!task){
            return res.status(404).send();
        }
        res.send(task)
    } catch (e) {
        res.status(500).send();
    }
})
//Alter Logic 
router.patch('/tasks/:id', auth, async (req,res) => {
    const updates = Object.keys(req.body) 
    const allowedUpdate = ['completed', 'description']
   
    if (!isValidOperation){
        return res.status(400).send( {error: "Invalid Operation"})
    }

    const isValidOperation = updates.every((update) => {
        return allowedUpdate.includes(update)
    })

    try {
        const task = await Task.findOne({_id: req.params.id, owner: req.user._id})

        updates.forEach((update)=>{
            task[update] = req.body[update]
        })

        await task.save();

        //const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true})
        if (!task){
            return res.status(404).send()
        }
        res.send(task)
    } catch (e) {
        res.status(400).send(e)
    }
})

//Export it to be used in index
module.exports = router