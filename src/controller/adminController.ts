import express, {Request, Response, NextFunction} from 'express'
import { option, GeneratePassword, GenerateSalt, GenerateOTP, onRequestOTP, emailHtml, sendmail, Generatesignature, verifySignature, loginSchema, validatePassword, updateSchema, adminSchema, vendorSchema} from '../utils'
import { fromAdminMail, fromAdminPhone, userSubject } from '../config'
import { UserAttributes, UserInstance } from '../model/userModel'
import {v4 as uuidV4} from 'uuid'
import { JwtPayload } from 'jsonwebtoken'
import { VendorAttributes, VendorInstance } from '../model/vendorModel'

export const AdminRegister = async (req: JwtPayload, res: Response, next: NextFunction) => {
    try{
        const id = req.user.id
        const { email, firstName, lastName, address, phone, password} = req.body
        const uuidUser = uuidV4()
        
        const validateResult = adminSchema.validate(req.body,option)

        if(validateResult.error){
            console.log(validateResult.error)
            return res.status(400).json({
                Error: validateResult.error.details[0].message
            })
        }

        //Generate Salt
        const salt = await GenerateSalt()
        const adminPassword = await GeneratePassword(password, salt)
        
        //Generate OTP
        const {otp, expiry} = GenerateOTP();

        //check if the Admin exist
        const Admin = await UserInstance.findOne({where:{id:id}}) as unknown as UserAttributes
        

        // if(Admin.email === email){
        //     return res.status(400).json({
        //         message: "Email already exist",
        //     })
        // }

        if(Admin.role === "superadmin"){
            const User = await UserInstance.findOne({where:{email:email}}) as unknown as UserAttributes

            if(!User){
                const newAdmin =  await UserInstance.create({
                    id: uuidUser,
                    email,
                    password:adminPassword,
                    firstName:'',
                    lastName:'',
                    salt,
                    address: '',
                    phone,
                    otp,
                    otp_expiry: expiry,
                    lng: 0,
                    lat: 0,
                    verified: true,
                    role: 'admin',
            
                })as unknown as UserAttributes
    
                //Send OTP to user
                // await onRequestOTP(otp, phone)
                
                //send mail to users
                // const html =  emailHtml(otp)
                // await sendmail(fromAdminMail, email, userSubject, html);
    
                //check if the admin exist
                //const Admin = await UserInstance.findOne({where:{id:id}})as unknown as UserAttributes
    
                //Generate signature from user
                const signature = await Generatesignature({
                    id: newAdmin.id,
                    email: newAdmin.email,
                    verified: newAdmin.verified
                })
    
                return res.status(201).json({
                    message: 'Admin Created Successfully',
                    signature,
                    verified: newAdmin.verified,
                    role: newAdmin.role,
                    password
                })
            }
            return res.status(400).json({
                message: 'Admin Already Exist'
            })
           
        }
        

    }catch(err){
        res.status(500).json({
            Error: "Internal server Error",
            route: "/admins/create-admin"
        })
    }
}

export const superAdmin = async (req:JwtPayload, res: Response) => {
    try {
      const { email, phone, password,firstName,lastName,address } = req.body;
      const uuiduser = uuidV4();
      const validateResult = adminSchema.validate(req.body, option);
      if (validateResult.error) {
        return res.status(400).json({
          Error: validateResult.error.details[0].message,
        });
      }
      //generate salt
      const salt = await GenerateSalt();
      const adminPassword = await GeneratePassword(password, salt);
      // //generate OTP
      const { otp, expiry } = GenerateOTP();
      // //check if the admin exist
      const Admin = (await UserInstance.findOne({
        where: { email: email },
      })) as unknown as UserAttributes;
      // create Admin
      if (!Admin) {
        await UserInstance.create({
          id: uuiduser,
          email,
          password: adminPassword,
          firstName,
          lastName,
          salt,
          address,
          phone,
          otp,
          otp_expiry: expiry,
          lng: 0,
          lat: 0,
          verified: true,
          role:"superadmin"
        });
        //check if the admin exist
        const Admin = (await UserInstance.findOne({
          where: { email: email },
        })) as unknown as UserAttributes;
        //Generate a signature
        let signature = await Generatesignature({
          id: Admin.id,
          email: Admin.email,
          verified: Admin.verified,
        });
        return res.status(201).json({
          message: "admin created successfully",
          signature,
          verified: Admin.verified,
        });
      }
      return res.status(400).json({
        message: "admin already exist",
      });
    } catch (err: any) {
      ///console.log(err.name)
      console.log(err.message);
      // console.log(err.stack)
      res.status(500).json({
        Error: "Internal server Error",
        route: "/admins/create-super-admin",
      });
    }
  };


/** ======================= Create Vendor ========================  **/
export const createVendor = async(req:JwtPayload, res: Response) => {
  try{
    const {name, restaurantName, pincode, phone, address, email, password} = req.body;

    const id = req.user.id
    

    const uuidVendor = uuidV4();

    const validateResult = vendorSchema.validate(req.body, option);
    if (validateResult.error) {
      return res.status(400).json({
        Error: validateResult.error.details[0].message,
      });
    }
    

    //generate salt
    const salt = await GenerateSalt();
    const vendorPassword = await GeneratePassword(password, salt);

    //check if the vendor exist
    const Vendor = (await VendorInstance.findOne({
      where: { email: email },
    })) as unknown as VendorAttributes

    const Admin= (await UserInstance.findOne({
      where: { id: id },
    })) as unknown as UserAttributes

    if(Admin.role === 'admin' || Admin.role === 'superadmin'){
      if(!Vendor){
        const createVendor = await VendorInstance.create({
          id: uuidVendor,
          email,
          password: vendorPassword,
          name,
          restaurantName,
          salt,
          address,
          phone,
          pincode,
          serviceAvailable: false,
          role:"vendor",
          rating: 0,
          coverImage: '',
        });
  
        return res.status(201).json({
          message: "Vendor created successfully",
          createVendor
        });
      }
  
      return res.status(400).json({
        message: "unauthorised",
      });
    }

    return res.status(400).json({
      message: "Vendor already exist",
    });

   


  }catch(err){
    res.status(500).json({
      Error: "Internal server Error",
      route: "/admins/create-vendors",
    });
  }

}
