import { VendorPayLoad } from "./Vendor.dto";
import {UserPayLoad} from './User.dto'

export type AuthPayLoad = VendorPayLoad | UserPayLoad

