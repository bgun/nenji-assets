'use strict';

let ical = require('ical');

let file = 'https://calendar.google.com/calendar/ical/jordancon.org_cv04qljf1e2km9blqdpo5h77j0%40group.calendar.google.com/public/basic.ics';

ical.fromURL(file, {}, (err, resp) => {
  if(err) {
    throw err;
  }
  console.log(resp);
});
