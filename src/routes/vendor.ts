import express, {Request, Response, NextFunction} from 'express'
import {AdminRegister, createVendor, superAdmin} from '../controller/adminController'
import { createFood, deleteFood, updateVendorProfile, vendorLogin, VendorProfile } from '../controller/vendorController'
import { auth, authVendor } from '../middleware/authorization'
import { upload } from '../utils/multer'
const router = express.Router()

router.post('/login', vendorLogin)
router.post('/create-food', authVendor, upload.single('image'), createFood)
router.get('/get-profile', authVendor, VendorProfile)
router.delete('/delete-food/:foodid', authVendor, deleteFood)
router.patch('/update-profile', authVendor, upload.single('coverImage'), updateVendorProfile)


export default router
