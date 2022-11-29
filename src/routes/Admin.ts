import express, {Request, Response, NextFunction} from 'express'
import {AdminRegister, createVendor, superAdmin} from '../controller/adminController'
import { auth } from '../middleware/authorization'


const router = express.Router()

router.post('/create-admin', auth, AdminRegister)
router.post('/create-super-admin', superAdmin)
router.post('/create-vendors',auth, createVendor)

export default router