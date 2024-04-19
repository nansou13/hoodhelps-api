import { Express, Request, Response, NextFunction } from 'express';
import { type CustomError } from '../utils/interfaces';
import { H } from '@highlight-run/node';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: 'smtp.ionos.fr',
    port: 465,
    auth: {
      user: process.env.MAILTRAP_USER,
      pass: process.env.MAILTRAP_PASSWORD,
    },
  })

const errorSetup = (app: Express) =>
  app

  .use((err: CustomError, req: Request, res: Response, next: NextFunction) => {
    if (process.env.NODE_ENV === 'production') {
      const parsed = H.parseHeaders(req.headers)
      H.consumeError(err, parsed?.secureSessionId, parsed?.requestId)
    }
    // Vérifiez si l'erreur est une erreur 4xx ou 5xx
    if (err.status >= 400 && err.status < 600) {
      // Format du message d'e-mail
      const emailBody = `Erreur détectée: ${err.status} - ${err.message}\n\nStack Trace:\n${err.stack}`
  
      // Envoyer l'e-mail
      transporter.sendMail(
        {
          from: 'errorhoodhelps@gigan.fr',
          to: 'hoodhelps@gigan.fr',
          subject: "Erreur dans l'API",
          text: emailBody,
        },
        (error: Error| null) => {
          if (error) {
            console.log("Erreur lors de l'envoi de l'e-mail", error)
          }
        }
      )
    }
  
    // Passez à l'erreur suivante (ou terminez la réponse si nécessaire)
    next(err)
  })

export default errorSetup;