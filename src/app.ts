import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { H } from '@highlight-run/node';

import { type CustomError } from './utils/interfaces';
import appSetup from './startup/init';
import routerSetup from './startup/router';
import errorSetup from './startup/errors';

const port = process.env.PORT || 5100

if (process.env.NODE_ENV === 'production') {
  H.init({
    projectID: 'zg0pkknd',
    serviceName: 'HoodHelps API',
    environment: 'production',
  })
}

const app = express();

appSetup(app);
routerSetup(app);
errorSetup(app);

app.listen(port, () => {
  console.log(`listening on *:${port}`)
})