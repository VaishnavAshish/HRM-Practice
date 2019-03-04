exports.responseToPage=(res,redirectURL,objectToSend,messageType,message) =>{
  // console.log(redirectURL,objectToSend,messageType,message);
  objectToSend.messageType=messageType;
  objectToSend.message=message;
  res.render(redirectURL,objectToSend);
}

exports.handleError=(res, reason, message, code) =>{
  // console.log("ERROR: " + reason);
  res.status(code || 500).json({"success":false,"message": message});
}

exports.shouldAbort = (err, client, done) => {
  if (err) {
    console.error('Error in transaction', err.stack)
    client.query('ROLLBACK', (err) => {
      if (err) {
        console.error('Error rolling back client', err.stack)
      }
      // release the client back to the pool
      done();
    })
  }
  return !!err
}

exports.sendSuccess = (res, message, obj,code) =>{
  // console.log("Successfully done: " + message);
  obj.success=true;
  obj.message=message;
  res.status(code || 200).json(obj);
}