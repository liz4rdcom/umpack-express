import * as umpackExpress from 'umpack-express';
import * as express from 'express';
import * as bodyParser from 'body-parser';

const app = express();

const smtpData = {
  host: 'localhost',
  port: 25,
  user: 'user',
  password: 'password'
};

const passwordResetData = {
  smtpData,
  senderEmail: 'test@email.com',
  resetKeyExpiresIn: '1h',
  passwordMessageFunction: (key: string) => {
    return 'take this key: ' + key;
  },
  passwordWrongEmailInstruction: (clientIp: string) => {
    return `<html><i style="background-color=#aaa">someone requested reset</i> with ip: <b>${clientIp}</b></html>`;
  }
};

const passwordResetPhoneData = {
  resetKeyExpiresIn: '1h',
  sendResetKey: (phone: string, resetKey: string) => {
    throw new Error("Not implemented yet");
  }
};

const logger = {
  error: console.error.bind(console),
  warn: console.warn.bind(console),
  info: console.info.bind(console),
  debug: console.log.bind(console),
  trace: console.trace.bind(console)
};

const umpack = umpackExpress({
  mongodbConnectionString: 'mongodb://localhost:27017/umpackServerTest',
  accessTokenSecret: 'myrandomstring',
  passwordHashSecret: 'mypasswordsecret',
  accessTokenExpiresIn: '1m',
  cookieAccessTokenName: 'access_token',
  passwordResetData,
  passwordResetPhoneData,
  deviceControl: true,
  logger
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));

app.use(express.static('./'));

const resRouter = express.Router();

resRouter.get('/', umpack.isAuthorized, (req, res, next) => {
  return res.send('your resources');
});

resRouter.get('/usermetadata', (req, res, next) => {
  umpack.getUserMetaDataByRequest(req)
    .then((result: any) => {
      return res.send(result);
    })
    .catch((err: Error) => {
      return res.status(400).send({ message: err.message });
    });
});

resRouter.get('/usersbymeta', (req, res, next) => {
  umpack.filterUsersByMetaData('organizationId', '2222')
    .then((users: any[]) => {
      res.send(users);
    })
    .catch((err: Error) => {
      return res.status(400).send({ message: err.message });
    });
});

resRouter.get('/userFullName', (req, res, next) => {
  umpack.getFullName('admin')
    .then((fullName: string) => {
      res.send(fullName);
    })
    .catch((err: Error) => {
      return res.status(400).send({ message: err.message });
    });
});

resRouter.get('/userRoles', umpack.isAuthorized, (req, res, next) => {
  umpack.getUserRolesByUserName('admin')
    .then((result: any) => {
      res.send(result);
    })
    .catch((err: Error) => {
      return res.status(400).send({ message: err.message });
    });
});

resRouter.get('/fullUserObject', (req, res, next) => {
  umpack.getFullUserObjectFromRequest(req)
    .then((result: any) => {
      res.send(result);
    })
    .catch((err: Error) => {
      return res.status(400).send({ message: err.message });
    });
});

app.use('/um', umpack.router);
app.use('/resources', resRouter);

app.use((req, res, next) => {
  res.redirect('/');
});

app.listen(3001, () => {
  console.log('start listening 3001');
});
