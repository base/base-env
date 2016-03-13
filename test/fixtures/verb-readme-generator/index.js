'use strict';

module.exports = function readme(app, base) {
  app.one = 'two';

  if (base.two) {
    app.two = base.two;
  }
};
