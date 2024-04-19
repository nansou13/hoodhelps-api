import { Express, Request, Response } from 'express';

// import userRoutes from './routes/userRoutes';
// import categoriesRoutes from './routes/categoriesRoutes';
// import groupsRoutes from './routes/groupsRoutes';
// import chatMessageRoutes from './routes/chatMessageRoutes';
// import cacheRoutes from './routes/cacheRoutes';

const routerSetup = (app: Express) =>
  app

  .get('/', async (req: Request, res: Response) => {
    res.send('Hello Express APIvantage!');
  });

  // .use('/api/users', userRoutes)
// .use('/api/categories', categoriesRoutes)
// .use('/api/groups', groupsRoutes)
// .use('/api/chat-message', chatMessageRoutes)
// .use('/api/cache', cacheRoutes)

export default routerSetup;