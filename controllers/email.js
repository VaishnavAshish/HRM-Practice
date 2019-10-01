
const nodemailer = require('nodemailer');
exports.sendMail = (req, res, next) => {
    // console.log('called');
    const transporter = nodemailer.createTransport({
      pool: true,
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      // auth: {
      //     user: 'noreply@krowsoftware.com', // Your email id
      //     pass: 'ggeekkoo11' // Your password
      // },
      auth: {
          user: 'support@krowsoftware.com', // Your email id
          pass: 'ggeekkoo22' // Your password
      },
      logger: true,
      tls: {
          // do not fail on invalid certs
          rejectUnauthorized: false
      }
    });
    /*const mailOptions = {
      to: req.body.email,
      from: 'ruchika.mittal@athenalogics.com',
      subject: "Hello " + req.body.email,
      text: 'Hello ' + req.body.email + '✔',
      html: "<p>Hello " + req.body.email + " </p>",

    };*/
    // console.log('transpoter');
    // console.log(req.mailOptions);
    return transporter.sendMail(req.mailOptions, function(error, info){
      // console.log('inside callback');
        if(error){
            // console.log(error);
            next(error,null);
        }else{
            // console.log('Message sent: ' + info.response);
            next(null,info);
            /*res.status(200).json({"success": true,"message":"success" });*/
        }
    });

};
