import express, {Request, Response, NextFunction} from 'express'
import { option, GeneratePassword, GenerateSalt, GenerateOTP, onRequestOTP, emailHtml, sendmail, Generatesignature, verifySignature, loginSchema, validatePassword, updateSchema, adminSchema, vendorSchema, updateVendorSchema} from '../utils'
import { fromAdminMail, userSubject } from '../config'
import { UserAttributes, UserInstance } from '../model/userModel'
import {v4 as uuidV4} from 'uuid'
import { JwtPayload } from 'jsonwebtoken'
import { VendorAttributes, VendorInstance } from '../model/vendorModel'
import { FoodAttributes, FoodInstance } from '../model/foodModel'

/** ======================= Vendor Login ========================  **/
export const vendorLogin = async (req: Request, res: Response) => {
    try{
        const { email, password} = req.body
        const validateResult = loginSchema.validate(req.body,option)
        if(validateResult.error){
            return res.status(400).json({
                Error: validateResult.error.details[0].message
            })
        }

   
        //check if vendor exist
        const Vendor = await VendorInstance.findOne({where:{email:email}})as unknown as VendorAttributes;
        
        if(Vendor){
           const validation = await validatePassword(password, Vendor.password, Vendor.salt)
           if(validation){

            // Generate signature for vendor
            let signature = await Generatesignature({
                id: Vendor.id,
                email: Vendor.email,
                serviceAvailable: Vendor.serviceAvailable
            });

            return res.status(200).json({
                message:"You have Successfully logged In",
                signature,
                email: Vendor.email,
                serviceAvailable: Vendor.serviceAvailable,
                role: Vendor.role,
            })
           }
        }

        return res.status(400).json({
            Error: "Wrong Username or password"
        })
    
    }catch(err){
        return res.status(500).json({
            Error: "Internal server Error",
            route: "/vendors/login"
        })
    }
}

/** ======================= Vendor Add Food ========================  **/

export const createFood = async (req: JwtPayload, res: Response) => {
    try{
        const id =  req.vendor.id
        const foodid = uuidV4();


        const {name, description, category, foodType, readyTime, price, image} = req.body;

        //check if vendor exist
        const Vendor = await VendorInstance.findOne({where:{id:id}})as unknown as VendorAttributes;
        
        if(Vendor){
            const createfood= await FoodInstance.create({
                id: foodid,
                name,
                description,
                category,
                foodType,
                readyTime,
                price,
                rating: 0,
                vendorId: id,
                image: req.file.path
              });
        
              return res.status(201).json({
                message: "Food added successfully",
                createfood
              });
            }
        
          return res.status(400).json({
            message: "unauthorised",
          });
       

    }catch(err){
        return res.status(500).json({
            Error: "Internal server Error",
            route: "/vendors/create-food"
        })
    }
}

/** =========================== GET VENDOR PROFILE =================================== */
export const VendorProfile = async(req: JwtPayload, res: Response) => {
    try{
        const id = req.vendor.id;

        //check if vendor exist
        const Vendor = await VendorInstance.findOne({
            where:{id:id},
        include: [
            {
                model:FoodInstance,
                as: 'food',
                attributes:["id", "name", "description", "category", "foodType", "readyTime", "price", "rating", "vendorId"]
            }
        ]})as unknown as VendorAttributes;

        return res.status(200).json({
            Vendor
        })


    }catch(err){
        return res.status(500).json({
            Error: "Internal server Error",
            route: "/vendors/get-profile"
        })
    }
}

/** =========================== VENDOR DELETE FOOD =================================== */
export const deleteFood = async (req: JwtPayload, res: Response) => {
    try{
        const id = req.vendor.id;
        const foodid = req.params.foodid


        //check if vendor exist
        const Vendor = await VendorInstance.findOne({where:{id:id}})as unknown as VendorAttributes;

        if(Vendor){
            const deleteFood = await FoodInstance.destroy({where: {id:foodid}})

            return res.status(200).json({
                message:"Food has been deleted",
                deleteFood
            })
        }


    }catch(err){
        return res.status(500).json({
            Error: "Internal server Error",
            route: "/vendors/delete-food"
        })
    }
}

/** =========================== VENDOR Update =================================== */
export const updateVendorProfile = async(req:JwtPayload, res:Response) => {
    
    try{
        const id = req.vendor.id;
        const {name,  phone, address, coverImage} = req.body

        const validateResult = updateVendorSchema.validate(req.body,option)
        if(validateResult.error){
            return res.status(400).json({
                Error: validateResult.error.details[0].message
            })
        }

        const User = await VendorInstance.findOne({where:{id: id}})as unknown as VendorAttributes;

        if(!User){
            return res.status(400).json({
                Error: "Not authorised to upfate your profile"
            })
        }

        const updatedUser = await VendorInstance.update({
            name, phone, address, coverImage:req.file.path
        }, {where:{id:id}})as unknown as UserAttributes

        if(updatedUser){
            return res.status(200).json({
                message: "You have successfully updated your profile",
                User
            })
        }

        return res.status(400).json({
            message:"Error updating your profile"
        })


    }catch(err){
        res.status(500).json({
            Error: "Internal server Error",
            route: "/vendors/update-profile"
        })
    }
}
