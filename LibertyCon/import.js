'use strict';

let _ = require('lodash');
let mysql = require('mysql');

let con_info = require('./con_info.json');
const SECRETS = require('../_CREDENTIALS.json').LibertyCon;

console.log(SECRETS.MYSQL_HOST);

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
  LIMIT 10
`;

const guests_query = `
  SELECT *
  FROM guests
  LIMIT 10
`;



 
connection.query(schedule_query, function (error, results, fields) {
  if (error) throw error;
  const events_group = _(results).groupBy(r => r.event_id).value();
  con_info.tracks = [];

  eventsDone = true;
  printInfoIfAllDone();
});


connection.query(guests_query, function (error, results, fields) {
  if (error) throw error;
  const guests = results.map(r => ({
    guest_id: r.id,
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
    console.log(con_info);
    process.exit();
  }
}
