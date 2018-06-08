'use strict';

let _ = require('lodash');
let mysql = require('mysql');
let moment = require('moment-timezone');

let con_info = require('./con_info.json');

// Don't commit to version control
const SECRETS = require('../_CREDENTIALS.json').LibertyCon;

let connection = mysql.createConnection({
  host     : SECRETS.MYSQL_HOST,
  user     : SECRETS.MYSQL_USER,
  password : SECRETS.MYSQL_PASS,
  database : SECRETS.MYSQL_DB
});
 
connection.connect();

const schedule_query = `
  SELECT
    schedule.id AS event_id,
    schedule.name AS title,
    schedule.date AS day,
    schedule.desc AS description,
    schedule.time AS time,
    sched_type_name AS track,
    guest_id
  FROM schedule
  LEFT JOIN sched_type ON schedule.type = sched_type.id
  LEFT JOIN schedule_guest ON schedule.id = schedule_guest.sched_id
  ORDER BY schedule.id
`;

const guests_query = `
  SELECT *
  FROM guests
`;



connection.query(schedule_query, function (error, results, fields) {
  if (error) throw error;
  const eventGroups = _.groupBy(results, r => r.event_id);
  // Reduce the left join to a list of guests for each event
  let events = Object.keys(eventGroups).map(id => {
    let first = eventGroups[id][0];
    first.guests = _.reduce(eventGroups[id], (acc, val) => {
      if (val.guest_id) acc.push("guest"+val.guest_id);
      return acc;
    }, []);
    return first;
  });

  events = events.map(ev => {
    return {
      event_id: 'event'+ev.event_id,
      time: ev.time,
      title: ev.title,
      description: ev.description,
      location: ev.location,
      day: moment(ev.day).tz('America/New_York').format('YYYY-MM-DD'),
      guests: ev.guests
    };
  });

  let trackGroups = _.groupBy(events, e => e.track);

  con_info.tracks = Object.keys(trackGroups).map(track => ({
    name: track,
    default: track === "Panel",
    events: trackGroups[track]
  }));

  eventsDone = true;
  printInfoIfAllDone();
});


connection.query(guests_query, function (error, results, fields) {
  if (error) throw error;
  const guests = results.map(r => ({
    guest_id: "guest"+r.id,
    name    : r.name,
    bio     : r.bio,
    image   : r.image
  }));
  con_info.guests = guests;

  guestsDone = true;
  printInfoIfAllDone();
});  



let eventsDone = false;
let guestsDone = false;
function printInfoIfAllDone() {
  if (eventsDone && guestsDone) {
    console.log(JSON.stringify(con_info, null, 2));
    process.exit();
  }
}
