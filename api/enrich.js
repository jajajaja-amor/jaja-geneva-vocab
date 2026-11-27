import {apiResponse} from '../enrich.mjs';
import {lookup} from 'node:dns/promises';
export default (req,res)=>apiResponse(req,res,{lookup});
