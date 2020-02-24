'use strict';

let _ = require('lodash');
let ical = require('ical');
let moment = require('moment-timezone');
let striptags = require('striptags');


let con_info = require("./con_info.json");

let calendarFiles = [{
  trackName: 'Art & Artists Track',
  calId: 'vm9qkisoee6a2jbappbkgb6avc'
},{
  trackName: 'Coffee Hour',
  calId: 't9ilue7778a7ouk5fsso7oaqco'
},{
  trackName: 'Fantasy Track',
  calId: 'qt04bdbc4o18s8ljecq3e3te44'
},{
  trackName: 'Gaming',
  calId: 'l4vnq9959t5lqihuvqld1mncog'
},{
  trackName: 'JordanCon Operations',
  calId: '5h4cehv6m7aq9enm08jdru72p4'
},{
  trackName: 'Main Programming',
  calId: 'p34lr538op8akb251p4gleltu0'
},{
  trackName: 'Meet-ups',
  calId: 'ucrnmatq9r9m08suvh8pt20gog'
},{
  trackName: 'Member Activities',
  calId: 'ktetqip9icguirsgb5t9n11vuc'
},{
  trackName: 'Sci-fi Track',
  calId: 'pt8kkrpubcprmbd94g12mqvbq8'
},{
  trackName: 'Workshops',
  calId: 'iq1diigcmgq6fqs5b44rtrasck'
},{
  trackName: 'World of the Wheel',
  calId: '29avm0u09e0tmrtl4b69d4dkkg'
},{
  trackName: 'Worlds of Brandon Sanderson',
  calId: 'ejvphetqei3kp5qfkpned9i26g'
},{
  trackName: 'Writers Track',
  calId: 'akdqcir2kv2qa2rqs693861208'
}];


// Removes special characters, converts to lowercase, and trims.
// Used to generate name slugs ("John Q. Smith-Public" to "johnqsmithpublic") and compare names.
let makeSlug = function(str) {
  return str.split(' ').join('_').replace(/\W/g,"").toLowerCase().trim();
};

let guestsSet = new Set();

let completedCallback = function(allTracks) {
  let guestsArray = Array.from(guestsSet).map(g => {
    let guest_id = makeSlug(g);
    let guest = _.find(con_info.guests, gg => gg.guest_id === guest_id);
    return {
      name: g,
      guest_id: guest_id,
      bio: guest && guest.bio ? guest.bio : "",
    }
  });
  guestsArray = _.uniqBy(guestsArray, g => g.guest_id);

  con_info.updated_at = moment();
  con_info.tracks = allTracks;
  con_info.guests = guestsArray;
  console.log(JSON.stringify(con_info));
};

let mapEvent = function(ev) {
  let guests, description;

  if (ev.description) {
    let descParts = striptags(ev.description)
      .split('&nbsp;').join(' ')
      .split('Panelists:');

    description = descParts[0];
    if (descParts.length === 2) {
      guests = descParts[1].split(',').map(s => s.trim());
      guests.forEach(g => {
        guestsSet.add(g);
      });
    }
  }

  return {
    day        : moment(ev.start).tz('America/New_York').format('YYYY-MM-DD'),
    time       : moment(ev.start).tz('America/New_York').format('HH:mm'),
    title      : ev.summary,
    description: description,
    guests     : guests ? guests.map(s => makeSlug(s)) : [],
    event_id   : ev.uid,
    location   : ev.location
  };
}


let main = function() {
  let results = [];
  calendarFiles.forEach(cal => {
    let calendar_url = 'https://calendar.google.com/calendar/ical/'+cal.calId+'%40group.calendar.google.com/public/basic.ics';
    ical.fromURL(calendar_url, {}, (err, resp) => {
      if(err) {
        throw err;
      }
      
      let arr = Object.keys(resp);
      arr = arr.filter(k => {
        return resp[k].summary && moment(resp[k].start).tz('America/New_York').year() === 2020;
      }).map(k => mapEvent(resp[k]));
      results.push({
        name: cal.trackName,
        default: !!cal.default,
        events: arr
      });
      if (results.length === calendarFiles.length) {
        completedCallback(_.sortBy(results, 'trackName'));
      }
    });
  });
};

main();
