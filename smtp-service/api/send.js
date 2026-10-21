import nodemailer from 'nodemailer';
import {makeHandler} from '../src/handler.js';
const transport=nodemailer.createTransport({host:'smtp.gmail.com',port:465,secure:true,auth:{user:process.env.SMTP_USER,pass:process.env.SMTP_PASS},connectionTimeout:3000,greetingTimeout:3000,socketTimeout:5000,logger:false,debug:false,disableFileAccess:true,disableUrlAccess:true});
export default makeHandler({env:process.env,sendMail:message=>transport.sendMail(message)});
