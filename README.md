math
====

MathML based chat

Built with [socket.io](http://socket.io) and [express](http://expressjs.com) on node.js with [asciimath.js](http://mathcs.chapman.edu/~jipsen/mathml/asciimath.html) and [mathml.css](https://github.com/fred-wang/mathml.css/blob/master/mathml.css), hosted on heroku.

##Contributing!

Fork the repo make changes and send a pull request!

##BUGS!

If you find one submit it [here](https://github.com/hansolo669/math/issues), do note that this is beta (maybe even alpha) quality software and there are still a number of features that need implementation.

###Local testing:

clone the repository locally, run `npm install` followed by `node app.js`.  
Assuming you have the heroku toolbelt installed you should be able to `foreman start`.

###Running on heroku:

The key requirement is the [labs websockets](https://devcenter.heroku.com/articles/heroku-labs-websockets) feature. From there its the same as deploying any other heroku app.
